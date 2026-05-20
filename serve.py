# Minimal static server to run the site locally.
# Usage: python serve.py
import http.server, socketserver, os, webbrowser

PORT = 8000
ROOT = os.path.dirname(__file__)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}/index.html")
        try:
            webbrowser.open(f"http://localhost:{PORT}/index.html")
        except Exception:
            pass
        httpd.serve_forever()
