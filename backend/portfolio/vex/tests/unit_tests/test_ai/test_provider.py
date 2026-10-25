import json
import os
import subprocess  # nosec B404: one fixed command, the test's own interpreter
import sys
import threading
import time
from collections.abc import Iterator
from contextlib import closing, contextmanager
from decimal import Decimal
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from unittest.mock import patch

import anthropic
import httpx2
from django.conf import settings
from django.test import SimpleTestCase, override_settings

from vex.ai import provider
from vex.ai.provider import MAX_RETRIES, TIMEOUT, Attempt, ChatMessage, Refused, Usage, stream_completion

PROMPT_USAGE = {"input_tokens": 200, "cache_read_input_tokens": 1000, "cache_creation_input_tokens": 24}


class FakeClaude(ThreadingHTTPServer):  # pylint: disable=too-many-instance-attributes
    """A local stand-in for Claude's streaming Messages endpoint: streams `chunks` tokens, one every `interval`
    seconds, then the stop reason and usage, or stalls after the first when `stall` is set. It records the request
    and its headers, how far it got and whether the client hung up. `final` adds fields to the closing usage, as
    a call that fell back reports its attempts."""

    def __init__(  # pylint: disable=too-many-arguments
        self,
        *,
        chunks: int = 50,
        interval: float = 0.05,
        stall: bool = False,
        stop_reason: str = "end_turn",
        model: str = "claude-opus-5-5",
        final: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(("127.0.0.1", 0), FakeClaudeHandler)
        self.daemon_threads = True
        self.chunks, self.interval, self.stall, self.stop_reason = chunks, interval, stall, stop_reason
        self.model, self.final = model, final or {}
        self.sent = 0
        self.request: dict[str, Any] = {}
        self.headers: dict[str, str] = {}
        self.disconnected = threading.Event()
        self.release = threading.Event()

    @property
    def base_url(self) -> str:
        return f"http://127.0.0.1:{self.server_port}"


class FakeClaudeHandler(BaseHTTPRequestHandler):
    server: FakeClaude

    def log_message(self, *_args: object) -> None:
        pass

    def write_event(self, **data: object) -> None:
        self.wfile.write(f"event: {data['type']}\ndata: {json.dumps(data)}\n\n".encode())
        self.wfile.flush()

    def do_POST(self) -> None:  # pylint: disable=invalid-name
        self.server.request = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        self.server.headers = {name.lower(): value for name, value in self.headers.items()}
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        try:
            message = {
                "id": "msg_1",
                "type": "message",
                "role": "assistant",
                "model": self.server.model,
                "content": [],
                "stop_reason": None,
                "stop_sequence": None,
                "usage": {**PROMPT_USAGE, "output_tokens": 1},
            }
            self.write_event(type="message_start", message=message)
            self.write_event(type="content_block_start", index=0, content_block={"type": "text", "text": ""})
            for i in range(self.server.chunks):
                self.write_event(type="content_block_delta", index=0, delta={"type": "text_delta", "text": f"t{i} "})
                self.server.sent += 1
                if self.server.stall:
                    self.server.release.wait(10)
                    return
                time.sleep(self.server.interval)
            self.write_event(type="content_block_stop", index=0)
            stop_details = {"type": "refusal", "category": "bio"} if self.server.stop_reason == "refusal" else None
            self.write_event(
                type="message_delta",
                delta={"stop_reason": self.server.stop_reason, "stop_sequence": None, "stop_details": stop_details},
                usage={"output_tokens": 30, "output_tokens_details": {"thinking_tokens": 12}, **self.server.final},
            )
            self.write_event(type="message_stop")
        except (BrokenPipeError, ConnectionResetError):
            self.server.disconnected.set()


@contextmanager
def fake_claude(**kwargs: Any) -> Iterator[FakeClaude]:
    server = FakeClaude(**kwargs)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    provider.client.cache_clear()
    try:
        with patch.dict(os.environ, {"ANTHROPIC_BASE_URL": server.base_url, "ANTHROPIC_API_KEY": "sk-ant-test"}):
            yield server
    finally:
        provider.client.cache_clear()
        server.release.set()
        server.shutdown()
        server.server_close()


MESSAGES: list[ChatMessage] = [{"role": "system", "content": "S"}, {"role": "user", "content": "Q"}]


def stream(usage: Usage | None = None) -> Iterator[str]:
    return stream_completion(MESSAGES, usage=usage or Usage())


@override_settings(
    ANTHROPIC_API_KEY="", VEX_MODEL="claude-opus-5-5", VEX_REASONING_EFFORT="low", VEX_MAX_OUTPUT_TOKENS=900
)
class StreamCompletionTestCase(SimpleTestCase):
    """Through the real Anthropic client, against a local server that speaks its streaming protocol."""

    def test_streams_the_models_text_and_reads_its_usage(self) -> None:
        usage = Usage()
        with fake_claude(chunks=3, interval=0) as server:
            chunks = list(stream(usage))
        self.assertEqual(chunks, ["t0 ", "t1 ", "t2 "])
        self.assertEqual(server.sent, 3)
        self.assertEqual(
            usage,
            Usage(
                input_tokens=1224,  # the whole prompt: fresh, read from the cache and written to it
                cached_tokens=1000,
                cache_write_tokens=24,
                output_tokens=30,
                reasoning_tokens=12,
                finish_reason="end_turn",
                model="claude-opus-5-5",
                reported=True,
            ),
        )

    def test_asks_for_the_configured_model_with_a_cached_system_prompt_and_a_fallback(self) -> None:
        with fake_claude(chunks=1, interval=0) as server:
            list(stream())
        request = server.request
        self.assertEqual(request["model"], "claude-opus-5-5")
        self.assertEqual(request["system"], [{"type": "text", "text": "S", "cache_control": {"type": "ephemeral"}}])
        self.assertEqual(request["messages"], [{"role": "user", "content": "Q"}])
        self.assertEqual(request["output_config"], {"effort": "low"})
        self.assertEqual(request["max_tokens"], 900)
        self.assertEqual(request["fallbacks"], "default")
        self.assertTrue(request["stream"])
        self.assertNotIn("thinking", request)  # Opus 5.5 always thinks; effort says how much
        self.assertIn("server-side-fallback-2026-07-01", server.headers["anthropic-beta"])

    def test_an_answer_cut_at_the_output_cap_is_logged(self) -> None:
        usage = Usage()
        with fake_claude(chunks=2, interval=0, stop_reason="max_tokens"), self.assertLogs("vex.ai.provider") as logs:
            list(stream(usage))
        self.assertEqual(usage.finish_reason, "max_tokens")
        self.assertIn("VEX_MAX_OUTPUT_TOKENS=900 (30 output tokens, 12 of them reasoning)", logs.output[0])

    def test_a_declined_answer_raises_once_its_usage_is_read(self) -> None:
        usage = Usage()
        with fake_claude(chunks=1, interval=0, stop_reason="refusal"), self.assertRaises(Refused) as raised:
            list(stream(usage))
        self.assertIn("category: bio", str(raised.exception))
        self.assertEqual((usage.finish_reason, usage.output_tokens, usage.reported), ("refusal", 30, True))

    def test_a_call_that_fell_back_counts_every_attempt_at_its_own_model(self) -> None:
        iterations = [
            {"type": "message", "input_tokens": 1224, "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0,
             "output_tokens": 5},
            {"type": "fallback_message", "model": "claude-opus-4-8", "input_tokens": 1224,
             "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0, "output_tokens": 30},
        ]  # fmt: skip
        usage = Usage()
        with fake_claude(chunks=1, interval=0, model="claude-opus-4-8", final={"iterations": iterations}):
            list(stream(usage))
        self.assertEqual(usage.model, "claude-opus-4-8")
        self.assertEqual(
            usage.attempts,
            (Attempt("claude-opus-5-5", 1224, 0, 0, 5), Attempt("claude-opus-4-8", 1224, 0, 0, 30)),
        )
        self.assertEqual((usage.input_tokens, usage.output_tokens), (2448, 35))
        # 1224 in and 5 out at Opus 5.5's $4/$20, then 1224 in and 30 out at Opus 4.8's $5/$25
        self.assertEqual(usage.cost(), Decimal("0.011866"))

    def test_closing_the_stream_hangs_up_on_the_provider_with_the_prompt_counted(self) -> None:
        usage = Usage()
        with fake_claude(chunks=50, interval=0.05) as server:
            chunks = stream(usage)
            for _ in range(3):
                next(chunks)
            started = time.monotonic()
            chunks.close()  # type: ignore[attr-defined]
            closed_in = time.monotonic() - started
            # The server notices at its next write, one interval later.
            self.assertTrue(server.disconnected.wait(1))
        self.assertLess(closed_in, 0.5)
        self.assertLess(server.sent, 10)  # the full answer would be 50
        # The prompt's counts came as the stream opened; the answer's never did.
        self.assertEqual((usage.input_tokens, usage.cached_tokens, usage.cache_write_tokens), (1224, 1000, 24))
        self.assertEqual((usage.model, usage.reported), ("claude-opus-5-5", False))

    def test_a_provider_that_stalls_mid_answer_times_out(self) -> None:
        with (
            fake_claude(stall=True),
            patch("vex.ai.provider.TIMEOUT", anthropic.Timeout(0.3, connect=0.3)),
            closing(stream()) as chunks,  # type: ignore[type-var]
        ):
            self.assertEqual(next(chunks), "t0 ")
            started = time.monotonic()
            # Mid-stream the SDK lets its HTTP client's error through rather than its own APITimeoutError.
            with self.assertRaises(httpx2.ReadTimeout):
                next(chunks)
        self.assertLess(time.monotonic() - started, 2)


@override_settings(VEX_MODEL="claude-opus-5-5", VEX_PRICES={"claude-opus-5-5": (4.00, 0.20, 5.00, 20.00)})
class UsageCostTestCase(SimpleTestCase):
    def test_fresh_cached_and_written_input_and_output_each_at_their_price(self) -> None:
        usage = Usage(
            input_tokens=1_000_000,
            cached_tokens=600_000,
            cache_write_tokens=100_000,
            output_tokens=200_000,
            reasoning_tokens=50_000,
        )
        # 300k fresh at 4.00, 600k read at 0.20, 100k written at 5.00, 200k output (thinking included) at 20.00
        self.assertEqual(usage.cost(), Decimal("5.82"))

    @override_settings(
        VEX_PRICES={"claude-opus-5-5": (4.00, 0.20, 5.00, 20.00), "claude-haiku-5-5": (0.10, 0.01, 0.125, 0.50)}
    )
    def test_the_answering_model_is_priced_and_one_without_a_price_at_the_highest_known(self) -> None:
        usage = Usage(input_tokens=1_000_000, cached_tokens=600_000, output_tokens=200_000, model="claude-haiku-5-5")
        # 400k fresh at 0.10, 600k read at 0.01, 200k output at 0.50
        self.assertEqual(usage.cost(), Decimal("0.146"))
        usage.model = "claude-unknown"
        with self.assertLogs("vex.ai.provider", "ERROR") as logs:
            cost = usage.cost()
        # 400k fresh at 4.00, 600k read at 0.20, 200k output at 20.00: never None, which the budget would skip
        self.assertEqual(cost, Decimal("5.72"))
        self.assertIn("claude-unknown", logs.output[0])


class ModelPriceGuardTestCase(SimpleTestCase):
    def test_the_suggested_models_and_the_fallbacks_have_prices(self) -> None:
        for model in ("claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5", "claude-opus-4-8"):
            self.assertIn(model, settings.VEX_PRICES)

    def test_settings_refuse_a_model_without_a_price(self) -> None:
        # Settings load in every process that serves the site (gunicorn's wsgi import, every manage.py command), so
        # a refusal there stops the deploy rather than leaving a budget that never counts.
        result = subprocess.run(  # nosec B603: a fixed argument list, no shell
            [sys.executable, "-c", "import django; django.setup()"],
            cwd=settings.BASE_DIR,
            env={**os.environ, "DJANGO_SETTINGS_MODULE": "portfolio.settings", "VEX_MODEL": "claude-unpriced"},
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ImproperlyConfigured: VEX_MODEL='claude-unpriced' has no price in VEX_PRICES", result.stderr)


class ProviderClientTestCase(SimpleTestCase):
    def test_the_client_gives_up_on_a_silent_provider(self) -> None:
        provider.client.cache_clear()
        try:
            with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "sk-ant-test"}):
                client = provider.client()
        finally:
            provider.client.cache_clear()
        self.assertEqual(client.timeout, TIMEOUT)
        self.assertEqual(client.max_retries, MAX_RETRIES)
