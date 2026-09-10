"""
Middleware to add Cross-Origin headers required for SharedArrayBuffer.
SharedArrayBuffer is needed so the Pyodide Web Worker can block (Atomics.wait)
while waiting for user input, without freezing the browser.
"""


class COOPCOEPMiddleware:
    """Add Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['Cross-Origin-Opener-Policy'] = 'same-origin'
        response['Cross-Origin-Embedder-Policy'] = 'credentialless'
        return response
