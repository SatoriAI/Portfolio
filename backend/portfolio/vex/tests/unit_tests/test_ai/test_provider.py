import json
import os
import threading
import time
from collections.abc import Iterator
from contextlib import closing, contextmanager
from decimal import Decimal
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from unittest.mock import patch

import openai
from django.test import SimpleTestCase, override_settings

from vex.ai import provider
from vex.ai.provider import MAX_RETRIES, TIMEOUT, ChatMessage, Usage, stream_completion


class FakeOpenAI(ThreadingHTTPServer):  # pylint: disable=too-many-instance-attributes
    """A local stand-in for OpenAI's chat completions endpoint: streams `chunks` tokens, one every `interval`
    seconds, then a usage chunk, or stalls after the first when `stall` is set. It records the request, how far it
    got and whether the client hung up."""

    def __init__(
        self, chunks: int = 50, interval: float = 0.05, stall: bool = False, finish_reason: str = "stop"
    ) -> None:
        super().__init__(("127.0.0.1", 0), FakeOpenAIHandler)
        self.daemon_threads = True
        self.chunks, self.interval, self.stall, self.finish_reason = chunks, interval, stall, finish_reason
        self.sent = 0
        self.request: dict[str, Any] = {}
        self.disconnected = threading.Event()
        self.release = threading.Event()

    @property
    def base_url(self) -> str:
        return f"http://127.0.0.1:{self.server_port}/v1"


class FakeOpenAIHandler(BaseHTTPRequestHandler):
    server: FakeOpenAI

    def log_message(self, *_args: object) -> None:
        pass

    def write_chunk(self, **fields: object) -> None:
        chunk = {"id": "c", "object": "chat.completion.chunk", "created": 0, "model": "m", **fields}
        self.wfile.write(f"data: {json.dumps(chunk)}\n\n".encode())
        self.wfile.flush()

    def do_POST(self) -> None:  # pylint: disable=invalid-name
        self.server.request = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        try:
            for i in range(self.server.chunks):
                self.write_chunk(choices=[{"index": 0, "delta": {"content": f"t{i} "}, "finish_reason": None}])
                self.server.sent += 1
                if self.server.stall:
                    self.server.release.wait(10)
                    return
                time.sleep(self.server.interval)
            self.write_chunk(choices=[{"index": 0, "delta": {}, "finish_reason": self.server.finish_reason}])
            usage = {
                "prompt_tokens": 1200,
                "completion_tokens": 30,
                "total_tokens": 1230,
                "prompt_tokens_details": {"cached_tokens": 1024},
                "completion_tokens_details": {"reasoning_tokens": 12},
            }
            self.write_chunk(choices=[], usage=usage)
            self.wfile.write(b"data: [DONE]\n\n")
        except (BrokenPipeError, ConnectionResetError):
            self.server.disconnected.set()


@contextmanager
def fake_openai(**kwargs: object) -> Iterator[FakeOpenAI]:
    server = FakeOpenAI(**kwargs)  # type: ignore[arg-type]
    threading.Thread(target=server.serve_forever, daemon=True).start()
    provider.client.cache_clear()
    try:
        with patch.dict(os.environ, {"OPENAI_BASE_URL": server.base_url, "OPENAI_API_KEY": "sk-test"}):
            yield server
    finally:
        provider.client.cache_clear()
        server.release.set()
        server.shutdown()
        server.server_close()


MESSAGES: list[ChatMessage] = [{"role": "system", "content": "S"}, {"role": "user", "content": "Q"}]


def stream(usage: Usage | None = None) -> Iterator[str]:
    return stream_completion(MESSAGES, cache_key="vex-en", usage=usage or Usage())


@override_settings(OPENAI_API_KEY="", VEX_MODEL="gpt-6-luna", VEX_REASONING_EFFORT="low", VEX_MAX_OUTPUT_TOKENS=900)
class StreamCompletionTestCase(SimpleTestCase):
    """Through the real OpenAI client, against a local server that speaks its streaming protocol."""

    def test_streams_the_models_text_and_reads_its_usage(self) -> None:
        usage = Usage()
        with fake_openai(chunks=3, interval=0) as server:
            chunks = list(stream(usage))
        self.assertEqual(chunks, ["t0 ", "t1 ", "t2 "])
        self.assertEqual(server.sent, 3)
        self.assertEqual(
            usage,
            Usage(
                input_tokens=1200,
                cached_tokens=1024,
                output_tokens=30,
                reasoning_tokens=12,
                finish_reason="stop",
                reported=True,
            ),
        )

    def test_an_answer_cut_at_the_output_cap_is_logged(self) -> None:
        usage = Usage()
        with fake_openai(chunks=2, interval=0, finish_reason="length"), self.assertLogs("vex.ai.provider") as logs:
            list(stream(usage))
        self.assertEqual(usage.finish_reason, "length")
        self.assertIn("VEX_MAX_OUTPUT_TOKENS=900 (30 output tokens, 12 of them reasoning)", logs.output[0])

    def test_asks_for_the_configured_model_with_a_bounded_answer_and_a_cache_key(self) -> None:
        with fake_openai(chunks=1, interval=0) as server:
            list(stream())
        request = server.request
        self.assertEqual(request["model"], "gpt-6-luna")
        self.assertEqual(request["messages"], MESSAGES)
        self.assertEqual(request["reasoning_effort"], "low")
        self.assertEqual(request["max_completion_tokens"], 900)
        self.assertEqual(request["prompt_cache_key"], "vex-en")
        self.assertTrue(request["stream"])
        self.assertEqual(request["stream_options"], {"include_usage": True})

    def test_closing_the_stream_hangs_up_on_the_provider(self) -> None:
        with fake_openai(chunks=50, interval=0.05) as server:
            chunks = stream()
            for _ in range(3):
                next(chunks)
            started = time.monotonic()
            chunks.close()  # type: ignore[attr-defined]
            closed_in = time.monotonic() - started
            # The server notices at its next write, one interval later.
            self.assertTrue(server.disconnected.wait(1))
        self.assertLess(closed_in, 0.5)
        self.assertLess(server.sent, 10)  # the full answer would be 50

    def test_a_provider_that_stalls_mid_answer_times_out(self) -> None:
        with (
            fake_openai(stall=True),
            patch("vex.ai.provider.TIMEOUT", openai.Timeout(0.3, connect=0.3)),
            closing(stream()) as chunks,  # type: ignore[type-var]
        ):
            self.assertEqual(next(chunks), "t0 ")
            started = time.monotonic()
            with self.assertRaises(openai.APITimeoutError):
                next(chunks)
        self.assertLess(time.monotonic() - started, 2)


@override_settings(VEX_PRICES={"gpt-6-luna": (0.10, 0.01, 0.50)})
class UsageCostTestCase(SimpleTestCase):
    def test_fresh_and_cached_input_and_output_each_at_their_price(self) -> None:
        usage = Usage(input_tokens=1_000_000, cached_tokens=600_000, output_tokens=200_000, reasoning_tokens=50_000)
        # 400k fresh at 0.10, 600k cached at 0.01, 200k output (reasoning included) at 0.50
        self.assertEqual(usage.cost("gpt-6-luna"), Decimal("0.146"))

    def test_a_model_without_a_price_has_no_cost(self) -> None:
        self.assertIsNone(Usage(input_tokens=10).cost("gpt-unknown"))


class ProviderClientTestCase(SimpleTestCase):
    def test_the_client_gives_up_on_a_silent_provider(self) -> None:
        provider.client.cache_clear()
        try:
            with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-test"}):
                client = provider.client()
        finally:
            provider.client.cache_clear()
        self.assertEqual(client.timeout, TIMEOUT)
        self.assertEqual(client.max_retries, MAX_RETRIES)
