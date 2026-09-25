"""Servidor local para probar la app en el computador.

Uso:  python servidor.py        (y abrir http://localhost:8000)
      python servidor.py 8123   (otro puerto)

Desactiva la caché del navegador para ver siempre los últimos cambios.
"""
import http.server
import sys
from pathlib import Path


class SinCache(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".webmanifest": "application/manifest+json",
        ".woff2": "font/woff2",
        ".svg": "image/svg+xml",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).resolve().parent), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Calculadora de las nietas en http://localhost:{puerto}  (Ctrl+C para detener)")
    http.server.ThreadingHTTPServer(("", puerto), SinCache).serve_forever()
