import http.server
import json
import os
import urllib.parse
import socketserver

PORT = 8000
DATA_DIR = "data"

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

class MindBloomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Prevent caching for dynamic API responses
        if self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if path == "/api/get-user":
            username = query.get("username", [None])[0]
            if not username:
                self.send_json({"success": False, "error": "Username query parameter is required"}, 400)
                return
            
            username = username.strip().lower()
            filename = f"user_{username}.json"
            filepath = os.path.join(DATA_DIR, filename)

            if not os.path.exists(filepath):
                self.send_json({"success": False, "error": "User not found"}, 404)
                return

            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    user_data = json.load(f)
                self.send_json(user_data, 200)
            except Exception as e:
                self.send_json({"success": False, "error": f"Failed to read user file: {str(e)}"}, 500)
            return

        elif path == "/api/list-users":
            users = []
            if os.path.exists(DATA_DIR):
                for filename in os.listdir(DATA_DIR):
                    if filename.startswith("user_") and filename.endswith(".json"):
                        filepath = os.path.join(DATA_DIR, filename)
                        try:
                            with open(filepath, "r", encoding="utf-8") as f:
                                data = json.load(f)
                            username = filename[5:-5]
                            users.append({
                                "username": username,
                                "childFirstName": data.get("childFirstName", ""),
                                "childLastName": data.get("childLastName", ""),
                                "coins": data.get("gameState", {}).get("coins", 0),
                                "level": data.get("gameState", {}).get("level", 1)
                            })
                        except Exception:
                            pass
            self.send_json(users, 200)
            return

        elif path == "/api/puzzle-averages":
            averages = {}
            if os.path.exists(DATA_DIR):
                for filename in os.listdir(DATA_DIR):
                    if filename.startswith("user_") and filename.endswith(".json"):
                        filepath = os.path.join(DATA_DIR, filename)
                        try:
                            with open(filepath, "r", encoding="utf-8") as f:
                                data = json.load(f)
                            completed = data.get("gameState", {}).get("completedPuzzles", {})
                            for pid, record in completed.items():
                                if record.get("answered") and record.get("correct") is True:
                                    attempts = record.get("attempts", [])
                                    seconds = None
                                    for att in attempts:
                                        if att.get("correct") is True:
                                            seconds = att.get("secondsSpent")
                                            break
                                    if seconds is None:
                                        seconds = 10
                                    if pid not in averages:
                                        averages[pid] = []
                                    averages[pid].append(seconds)
                        except Exception:
                            pass
            result = {}
            for pid, times in averages.items():
                if times:
                    result[pid] = round(sum(times) / len(times))
            self.send_json(result, 200)
            return

        # Fall back to default handler for static files
        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path in ("/api/register", "/api/save-user", "/api/delete-user"):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                body = json.loads(post_data.decode('utf-8'))
            except Exception as e:
                self.send_json({"success": False, "error": "Invalid JSON payload"}, 400)
                return

            username = body.get("username")
            if not username:
                self.send_json({"success": False, "error": "Username is required"}, 400)
                return
            username = username.strip().lower()

            # Ensure data directory exists
            if not os.path.exists(DATA_DIR):
                os.makedirs(DATA_DIR)

            filename = f"user_{username}.json"
            filepath = os.path.join(DATA_DIR, filename)

            if path == "/api/register":
                if os.path.exists(filepath):
                    self.send_json({"success": False, "error": "Username already exists. Try a different one!"}, 400)
                    return
                
                user_data = body.get("userData", body)
                # Ensure password is saved if it was passed
                if "password" not in user_data and "password" in body:
                    user_data["password"] = body["password"]

                try:
                    with open(filepath, "w", encoding="utf-8") as f:
                        json.dump(user_data, f, indent=2, ensure_ascii=False)
                    self.send_json({"success": True}, 200)
                except Exception as e:
                    self.send_json({"success": False, "error": f"Failed to save registration: {str(e)}"}, 500)

            elif path == "/api/save-user":
                user_data = body.get("userData", body)
                # Keep password if not specified, or just write whatever payload was sent.
                if os.path.exists(filepath):
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            existing = json.load(f)
                        if "password" not in user_data and "password" in existing:
                            user_data["password"] = existing["password"]
                    except Exception:
                        pass
                
                try:
                    with open(filepath, "w", encoding="utf-8") as f:
                        json.dump(user_data, f, indent=2, ensure_ascii=False)
                    self.send_json({"success": True}, 200)
                except Exception as e:
                    self.send_json({"success": False, "error": f"Failed to save user: {str(e)}"}, 500)

            elif path == "/api/delete-user":
                # For safety, only allow deleting users starting with "__test_"
                if not username.startswith("__test_"):
                    self.send_json({"success": False, "error": "Only test users can be deleted"}, 403)
                    return
                
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                        self.send_json({"success": True}, 200)
                    except Exception as e:
                        self.send_json({"success": False, "error": f"Failed to delete file: {str(e)}"}, 500)
                else:
                    self.send_json({"success": True, "message": "File did not exist"}, 200)

            return

        # Fallback
        super().do_POST()

    def send_json(self, data, status_code=200):
        response_bytes = json.dumps(data, indent=2, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

def run():
    server_address = ('', PORT)
    httpd = ThreadingHTTPServer(server_address, MindBloomHandler)
    print(f"MindBloom Threaded Server running on http://localhost:{PORT} ...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run()
