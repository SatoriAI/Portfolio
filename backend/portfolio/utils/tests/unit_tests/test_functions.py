from unittest.mock import Mock

from django.http import HttpRequest
from django.test import TestCase

from utils.functions import ensure_session


class UtilsFunctionsTestCase(TestCase):
    # -------------------------
    # ensure_session
    # -------------------------
    def test_ensure_session_creates_new_session_when_none_exists(self) -> None:
        request = HttpRequest()
        request.session = Mock()
        request.session.session_key = None
        request.session.create = Mock()

        def mock_create():
            request.session.session_key = "test_session_key_123"

        request.session.create.side_effect = mock_create

        result = ensure_session(request)

        request.session.create.assert_called_once()  # Verify session.create() was called
        self.assertEqual(result, "test_session_key_123")  # Verify the session key is returned

    def test_ensure_session_returns_existing_session_key(self) -> None:
        request = HttpRequest()
        request.session = Mock()
        request.session.session_key = "existing_session_key_456"
        request.session.create = Mock()

        result = ensure_session(request)

        request.session.create.assert_not_called()  # Verify session.create() was NOT called
        self.assertEqual(result, "existing_session_key_456")  # Verify the existing session key is returned

    def test_ensure_session_with_empty_string_session_key(self) -> None:
        request = HttpRequest()
        request.session = Mock()
        request.session.session_key = ""
        request.session.create = Mock()

        def mock_create():
            request.session.session_key = "new_session_key_789"

        request.session.create.side_effect = mock_create

        result = ensure_session(request)

        request.session.create.assert_called_once()  # Verify session.create() was called (empty string is falsy)
        self.assertEqual(result, "new_session_key_789")  # Verify the new session key is returned
