import httpx

# How long a call to OpenAI may take. Without these the client waits forever on a provider that stops sending
# (httpx's timeouts are off by default) and retries twice more on top. The read timeout bounds each wait for the
# next chunk, so a stalled answer fails within half a minute instead of holding a server thread.
TIMEOUT = httpx.Timeout(30, connect=5)
MAX_RETRIES = 1
