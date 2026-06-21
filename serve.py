#!/usr/bin/env python3
"""Dev server for the blueprint static site.
Serves files normally; on 404 serves pages/error.html with HTTP 404 status."""
import http.server
import os

PORT = 8787
ROOT = os.path.dirname(os.path.abspath(__file__))
ERROR_PAGE = os.path.join(ROOT, 'pages', 'error.html')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            try:
                with open(ERROR_PAGE, 'rb') as f:
                    body = f.read()
                self.send_response(404)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            except OSError:
                pass
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        # Suppress the default per-request noise; keep errors
        if args and str(args[1]) not in ('200', '304'):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    with http.server.HTTPServer(('', PORT), Handler) as httpd:
        print(f'blueprint dev server → http://localhost:{PORT}')
        httpd.serve_forever()
