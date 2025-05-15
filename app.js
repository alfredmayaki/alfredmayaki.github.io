const express = require('express');
const path = require('path');
const app = express();

// Serve static files (including index.html)
app.use(express.static(__dirname));

// Landing page route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Landing Page</title>
      <style>
        body { background: #161616; color: #fff; text-align: center; font-family: Arial, sans-serif; }
        a { color: #07c520; font-size: 1.5em; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Welcome!</h1>
      <p><a href="/index.html">Go to Main Site</a></p>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));