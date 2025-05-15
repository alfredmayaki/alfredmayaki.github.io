from flask import Flask, url_for

app = Flask(__name__)

@app.route("/")
def landing():
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <title>Landing Page</title>
      <style>
        body {{ background: #161616; color: #fff; text-align: center; font-family: Arial, sans-serif; }}
        a {{ color: #07c520; font-size: 1.5em; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
      </style>
    </head>
    <body>
      <h1>Welcome!</h1>
      <p><a href="{url_for('static', filename='index.html')}">Go to Main Site</a></p>
    </body>
    </html>
    """

# Serve index.html as a static file
# Place index.html in a folder named 'static' in the same directory as this app.py

if __name__ == "__main__":
    app.run(debug=True)