const express = require('express');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const path = require('path');

// REQUIRE: place your Firebase Admin service account JSON at ./serviceAccountKey.json
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.json());
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

app.listen(3000, () => console.log('Dev server listening on http://localhost:3000'));