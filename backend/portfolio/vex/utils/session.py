import re

# Vex's session keys are Django's own (see utils.functions.ensure_session): 32 characters from a-z and 0-9. Anything
# else was not issued by this server, so it is turned away before it can reach the database.
SESSION_KEY_PATTERN = re.compile(r"[a-z0-9]{32}")


def is_valid_session_key(key: str | None) -> bool:
    return bool(key) and SESSION_KEY_PATTERN.fullmatch(key) is not None
