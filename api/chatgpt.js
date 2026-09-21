// Simple Node-compatible serverless handler for forwarding queries to OpenAI Chat completions (ChatGPT)
// Expects OPENAI_API_KEY in environment. Returns JSON { success, text, raw }

const fetch = require('node-fetch');

module.exports = async function (req, res) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Allow', 'POST');
      return res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    }

    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data ? JSON.parse(data) : {}));
      req.on('error', err => reject(err));
    });

    const prompt = body.message || body.prompt || '';
    if (!prompt) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false, error: 'Missing message' }));
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ success: false, error: 'Server misconfigured: missing OPENAI_API_KEY' }));
    }

    // call OpenAI Chat Completion (gpt-3.5-turbo as example)
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

    if (!response.ok) {
      res.statusCode = 502;
      return res.end(JSON.stringify({ success: false, error: 'OpenAI API error', raw: data }));
    }

    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : '';

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, text, raw: data }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
};
