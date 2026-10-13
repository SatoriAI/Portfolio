import json
import os
import threading
import time
from collections.abc import Iterator
from contextlib import closing, contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

import httpx
from django.test import TestCase

from vex.ai.database import vector
from vex.ai.provider import MAX_RETRIES, TIMEOUT
from vex.ai.rag import RagChain


class FakeOpenAI(ThreadingHTTPServer):
    """A local stand-in for OpenAI's chat completions endpoint: streams `chunks` tokens, one every `interval`
    seconds, or stalls after the first when `stall` is set. It records how far it got and whether the client hung up.
    """

    def __init__(self, chunks: int = 50, interval: float = 0.05, stall: bool = False) -> None:
        super().__init__(("127.0.0.1", 0), FakeOpenAIHandler)
        self.daemon_threads = True
        self.chunks, self.interval, self.stall = chunks, interval, stall
        self.sent = 0
        self.disconnected = threading.Event()
        self.release = threading.Event()

    @property
    def base_url(self) -> str:
        return f"http://127.0.0.1:{self.server_port}/v1"


class FakeOpenAIHandler(BaseHTTPRequestHandler):
    server: FakeOpenAI

    def log_message(self, *_args: object) -> None:
        pass

    def do_POST(self) -> None:  # pylint: disable=invalid-name
        self.rfile.read(int(self.headers["Content-Length"]))
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        try:
            for i in range(self.server.chunks):
                delta = {"choices": [{"index": 0, "delta": {"content": f"t{i} "}, "finish_reason": None}]}
                chunk = {"id": "c", "object": "chat.completion.chunk", "created": 0, "model": "m", **delta}
                self.wfile.write(f"data: {json.dumps(chunk)}\n\n".encode())
                self.wfile.flush()
                self.server.sent += 1
                if self.server.stall:
                    self.server.release.wait(10)
                    return
                time.sleep(self.server.interval)
            self.wfile.write(b"data: [DONE]\n\n")
        except (BrokenPipeError, ConnectionResetError):
            self.server.disconnected.set()


@contextmanager
def fake_openai(**kwargs: object) -> Iterator[FakeOpenAI]:
    server = FakeOpenAI(**kwargs)  # type: ignore[arg-type]
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with (
            patch.dict(os.environ, {"OPENAI_BASE_URL": server.base_url, "OPENAI_API_KEY": "sk-test"}),
            patch.object(RagChain, "_merge_context", return_value="context"),
        ):
            yield server
    finally:
        server.release.set()
        server.shutdown()
        server.server_close()


INPUTS = {"question": "Q", "locale": "en", "history": []}


class RagChainStreamTestCase(TestCase):
    """Through the real ChatOpenAI client, against a local server that speaks OpenAI's streaming protocol."""

    def test_streams_the_models_text(self) -> None:
        with fake_openai(chunks=3, interval=0) as server:
            chunks = list(RagChain().stream(INPUTS))
        self.assertEqual(chunks, ["t0 ", "t1 ", "t2 "])
        self.assertEqual(server.sent, 3)

    def test_closing_the_stream_hangs_up_on_the_provider(self) -> None:
        with fake_openai(chunks=50, interval=0.05) as server:
            stream = RagChain().stream(INPUTS)
            for _ in range(3):
                next(stream)
            started = time.monotonic()
            stream.close()
            closed_in = time.monotonic() - started
            # The server notices at its next write, one interval later.
            self.assertTrue(server.disconnected.wait(1))
        self.assertLess(closed_in, 0.5)
        self.assertLess(server.sent, 10)  # the full answer would be 50

    def test_a_provider_that_stalls_mid_answer_times_out(self) -> None:
        with (
            fake_openai(stall=True),
            patch("vex.ai.rag.TIMEOUT", httpx.Timeout(0.3, connect=0.3)),
            closing(RagChain().stream(INPUTS)) as stream,
        ):
            self.assertEqual(next(stream), "t0 ")
            started = time.monotonic()
            with self.assertRaises(httpx.ReadTimeout):
                next(stream)
        self.assertLess(time.monotonic() - started, 2)


class ProviderClientTestCase(TestCase):
    def test_the_chat_model_gives_up_on_a_silent_provider(self) -> None:
        with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-test"}):
            llm = RagChain().llm
        self.assertEqual(llm.root_client.timeout, TIMEOUT)
        self.assertEqual(llm.root_client.max_retries, MAX_RETRIES)

    def test_the_embeddings_give_up_on_a_silent_provider(self) -> None:
        vector.store.cache_clear()
        try:
            with patch.dict(os.environ, {"OPENAI_API_KEY": "sk-test"}), patch.object(vector, "PGVector") as pgvector:
                vector.store()
            embeddings = pgvector.call_args.kwargs["embedding_function"]
        finally:
            vector.store.cache_clear()
        self.assertEqual(embeddings.client._client.timeout, TIMEOUT)  # pylint: disable=protected-access
        self.assertEqual(embeddings.client._client.max_retries, MAX_RETRIES)  # pylint: disable=protected-access
