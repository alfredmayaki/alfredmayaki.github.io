from flask import Flask, send_from_directory, redirect
import os

app = Flask(__name__, static_folder='.')

@app.route("/")
def landing():
    return send_from_directory('.', 'index.html')

@app.route("/<path:filename>")
def serve_file(filename):
    return send_from_directory('.', filename)

# Handle specific language routes
@app.route("/index_<lang>.html")
def language_page(lang):
    return send_from_directory('.', f'index_{lang}.html')

if __name__ == "__main__":
    app.run(debug=True, port=5000)