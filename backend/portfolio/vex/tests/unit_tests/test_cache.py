import threading
from unittest import TestCase
from unittest.mock import Mock, patch

import redis
from redis.exceptions import ConnectionError as RedisConnectionError

from vex.utils.cache import OPEN_SECONDS, CacheUnavailable, GuardedCache, breaker


class BreakerTestCase(TestCase):
    def setUp(self) -> None:
        self.now = 1000.0
        clock = patch("vex.utils.cache.time.monotonic", side_effect=lambda: self.now)
        clock.start()
        self.addCleanup(clock.stop)
        breaker.reset()
        self.addCleanup(breaker.reset)
        self.backend = Mock()
        self.cache = GuardedCache(self.backend)

    def test_after_one_failure_redis_is_left_alone_for_the_window(self) -> None:
        self.backend.get.side_effect = RedisConnectionError("refused")
        with self.assertLogs("vex.utils.cache", level="ERROR") as logs:
            for _ in range(5):
                with self.assertRaises(CacheUnavailable):
                    self.cache.get("key")
        self.assertEqual(self.backend.get.call_count, 1)
        self.assertEqual(len(logs.output), 1)
        self.assertIn("ConnectionError: refused", logs.output[0])

    def test_once_the_window_has_passed_one_caller_probes_and_closes_it(self) -> None:
        self.backend.get.side_effect = RedisConnectionError("refused")
        with self.assertLogs("vex.utils.cache", level="ERROR"), self.assertRaises(CacheUnavailable):
            self.cache.get("key")
        self.now += OPEN_SECONDS
        self.assertTrue(breaker.allow())  # this caller probes
        self.assertFalse(breaker.allow())  # the others keep skipping Redis meanwhile
        with self.assertLogs("vex.utils.cache", level="INFO") as logs:
            breaker.succeeded()
        self.assertIn("reachable again", logs.output[0])
        self.backend.get.side_effect, self.backend.get.return_value = None, "value"
        self.assertEqual(self.cache.get("key"), "value")

    def test_a_failed_probe_opens_a_new_window_with_one_error(self) -> None:
        self.backend.get.side_effect = RedisConnectionError("refused")
        with self.assertLogs("vex.utils.cache", level="ERROR") as logs:
            with self.assertRaises(CacheUnavailable):
                self.cache.get("key")
            self.now += OPEN_SECONDS
            for _ in range(3):
                with self.assertRaises(CacheUnavailable):
                    self.cache.get("key")
        self.assertEqual(self.backend.get.call_count, 2)
        self.assertEqual(len(logs.output), 2)

    def test_an_answer_that_is_not_a_redis_error_means_redis_is_up(self) -> None:
        # Django's incr raises ValueError for a missing key: Redis answered.
        self.backend.incr.side_effect = ValueError("missing")
        with self.assertRaises(ValueError):
            self.cache.incr("key", 1)
        self.assertTrue(breaker.allow())

    def test_threads_failing_together_log_one_error(self) -> None:
        start = threading.Barrier(8)

        def fail() -> None:
            start.wait()
            breaker.failed(redis.exceptions.TimeoutError("Timeout reading from socket"))

        with self.assertLogs("vex.utils.cache", level="ERROR") as logs:
            threads = [threading.Thread(target=fail) for _ in range(8)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
        self.assertEqual(len(logs.output), 1)


class RedisDatabaseTestCase(TestCase):
    def test_a_database_in_the_url_wins_over_the_configured_one(self) -> None:
        # settings.CACHES passes VEX_REDIS_DB as "db"; Railway's REDIS_URL names no database.
        pool = redis.ConnectionPool.from_url("redis://default:pw@redis.railway.internal:6379", db=5)
        self.assertEqual(pool.connection_kwargs["db"], 5)
        pool = redis.ConnectionPool.from_url("redis://default:pw@redis.railway.internal:6379/2", db=5)
        self.assertEqual(pool.connection_kwargs["db"], 2)
