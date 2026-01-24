// Example Express server that exposes /api/chatgpt and serves static files.
// Usage:
// 1. Copy .env.example -> .env and set OPENAI_API_KEY
// 2. npm install express node-fetch@2 dotenv
// 3. node server-example.js

// Load .env in development if available. Defensive require so server still runs if dotenv
// is not installed (useful if you prefer setting env vars directly in the environment).
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed or failed to load; assume environment variables are provided by host
}
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiter for API endpoints to protect OpenAI usage from abuse
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, error: 'Too many requests, please slow down.' }
});

// Enable CORS for the chat proxy so frontends hosted on other origins (GitHub Pages, Cloudflare) can POST here.
// Apply CORS before the rate limiter so preflight OPTIONS requests are handled.
app.use('/api/chatgpt', cors({ origin: true }), chatLimiter);

// Small HTML-escaping helper used by /results
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ChatGPT proxy route - returns JSON
app.post('/api/chatgpt', async (req, res) => {
  try {
    const prompt = req.body && (req.body.message || req.body.prompt) ? (req.body.message || req.body.prompt) : '';
    if (!prompt) return res.status(400).json({ success: false, error: 'Missing message' });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ success: false, error: 'Server misconfigured: missing OPENAI_API_KEY' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.6
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ success: false, error: 'OpenAI API error', raw: data });

    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : '';
    res.json({ success: true, text, raw: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// /results endpoint removed — ChatGPT HTML results flow deprecated.

// Serve static site (assumes index.html in current folder)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
