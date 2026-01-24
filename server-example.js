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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true }));

// ChatGPT proxy route
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

// Small HTML-escaping helper used by /results
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Results endpoint used by the front-end's "Open results" flow.
// Accepts either text/html (posted full HTML) or JSON { message } or plain text.
app.post('/results', async (req, res) => {
  try {
    const contentType = (req.headers['content-type'] || '').split(';')[0].trim();

    if (contentType === 'text/html') {
      // If a full HTML document is posted, return it as-is
      const bodyChunks = [];
      req.on('data', (chunk) => bodyChunks.push(chunk));
      req.on('end', () => {
        const html = Buffer.concat(bodyChunks).toString('utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
      });
      req.on('error', (err) => { throw err; });
      return;
    }

    // If JSON with a message was posted, call OpenAI and render the AI reply in an HTML results page
    if (req.is('application/json') && req.body && (req.body.message || req.body.prompt)) {
      const prompt = req.body.message || req.body.prompt || '';
      const OPENAI_API_KEY = process.env.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;
      if (!OPENAI_API_KEY) return res.status(500).send('<p>Server misconfigured: missing OPENAI_API_KEY</p>');

      // Call OpenAI chat completions
      const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }], max_tokens: 600, temperature: 0.6 })
      });

      const openaiData = await openaiResp.json();
      let aiText = '';
      if (openaiResp.ok && openaiData && openaiData.choices && openaiData.choices[0] && openaiData.choices[0].message) {
        aiText = openaiData.choices[0].message.content || '';
      } else {
        aiText = 'No reply (OpenAI error)';
      }

      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ChatGPT Results</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;background:#0b0b0b;color:#fff}h2{color:#3d4ee9}pre{white-space:pre-wrap;}</style></head><body><h2>ChatGPT Results</h2><pre>${escapeHtml(aiText)}</pre></body></html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    // For other content types, render a lightweight results page containing posted text
    let text = '';
    if (req.is('application/json')) {
      text = req.body && (req.body.message || req.body.text || req.body.html) ? (req.body.message || req.body.text || req.body.html) : '';
    } else if (req.is('application/x-www-form-urlencoded')) {
      text = req.body && (req.body.message || req.body.text) ? (req.body.message || req.body.text) : '';
    } else {
      // Fallback: read raw body
      const chunks = [];
      req.on('data', c => chunks.push(c));
      await new Promise((resolve) => req.on('end', resolve));
      text = Buffer.concat(chunks).toString('utf8');
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Results</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;background:#0b0b0b;color:#fff}h2{color:#3d4ee9}pre{white-space:pre-wrap;}</style></head><body><h2>ChatGPT Results</h2><pre>${escapeHtml(text)}</pre></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

    const data = await response.json();
    if (!response.ok) return res.status(502).json({ success: false, error: 'OpenAI API error', raw: data });

    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : '';
    res.json({ success: true, text, raw: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static site (assumes index.html in current folder)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
