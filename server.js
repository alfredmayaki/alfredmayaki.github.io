
const express = require('express');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fetch = require('node-fetch');

// REQUIRE: place your Firebase Admin service account JSON at ./serviceAccountKey.json
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Serve static site (put msc-survey.html in ./public/)
app.use(express.static(path.join(__dirname, 'public')));

// Create session cookie from client ID token (5 days)
app.post('/sessionLogin', async (req, res) => {
  const idToken = req.body?.idToken;
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  try {
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // Secure cookie settings for production (secure:true). On localhost secure:true requires HTTPS.
    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: false,   // set to true in production with HTTPS
      sameSite: 'Strict'
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('sessionLogin error', err);
    return res.status(401).json({ error: 'Failed to create session' });
  }
});

// POST /api/upload - accepts single file field 'file'
// returns { filename, text } (extracted text or summary)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const name = file.originalname || 'file';
    const ext = path.extname(name).toLowerCase();
    let text = '';

    if (ext === '.pdf' || file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      text = data.text || '';
    } else if (ext === '.docx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value || '';
    } else if (file.mimetype.startsWith('text/') || ['.txt'].includes(ext)) {
      text = file.buffer.toString('utf8');
    } else {
      // unknown type: return empty and let client decide
      text = '';
    }

    // Truncate to reasonable size
    const excerpt = (text || '').slice(0, 20000);

    return res.json({ filename: name, text: excerpt, source: 'extracted' });
  } catch (err) {
    console.error('Upload error', err);
    return res.status(500).json({ error: 'Extraction failed' });
  }
});

// POST /api/claude - proxy to configured Claude endpoint (stub if not configured)
// body: { model, prompt }
// Set CLAUDE_API_URL and CLAUDE_API_KEY in environment to enable real proxy
app.post('/api/claude', async (req, res) => {
  const { model, prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  const claudeUrl = process.env.CLAUDE_API_URL;
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!claudeUrl || !apiKey) {
    // Fallback simulated reply when not configured
    return res.json({ reply: 'Simulated reply: Claude integration not configured on this server.' });
  }

  try {
    const r = await fetch(claudeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model: model || 'claude-opus-4.5', prompt })
    });

    if (!r.ok) {
      const text = await r.text();
      console.warn('Claude proxy error', r.status, text);
      return res.status(502).json({ error: 'Claude upstream error' });
    }

    const json = await r.json();
    // adjust depending on upstream response format
    const reply = json.reply || json.output || json.text || JSON.stringify(json);
    return res.json({ reply });
  } catch (err) {
    console.error('Claude proxy exception', err);
    return res.status(500).json({ error: 'proxy failed' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API server listening on ${PORT}`));