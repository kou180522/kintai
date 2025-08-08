#!/usr/bin/env python3
"""
簡易HTTPサーバー - test_api.htmlを提供
使い方: python3 test_api_server.py
その後、ブラウザで http://localhost:8080/test_api.html にアクセス
"""

import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # CORS対応のヘッダーを追加
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super(MyHTTPRequestHandler, self).end_headers()

def run_server():
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"サーバー起動中: http://localhost:{PORT}/test_api.html")
        print("Ctrl+C で停止")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nサーバーを停止しました")

if __name__ == "__main__":
    run_server()