from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='.')

@app.route("/")
def landing():
    return send_from_directory('.', 'index.html')

@app.route("/<path:filename>")
def serve_file(filename):
    # Security: prevent directory traversal
    if '..' in filename or filename.startswith('/'):
        return "Invalid path", 400
    return send_from_directory('.', filename)

if __name__ == "__main__":
    # Use Heroku's PORT environment variable
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)