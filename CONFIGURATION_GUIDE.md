# Secure Configuration Setup Guide

## 🔐 Security First

Your Firebase credentials and configuration are **sensitive** and must never be committed to public repositories.

## 📋 Quick Setup

### Step 1: Create `.env.local` (Development Only)

Create a file called `.env.local` in your project root:

```bash
# Windows
copy .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

### Step 2: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **⚙️ Settings** → **Project Settings**
4. Find your **Web App** configuration
5. Copy these values to `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIzaSyD_your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789
VITE_BACKEND_URL=https://us-central1-your-project.cloudfunctions.net
```

### Step 3: Verify `.gitignore` Has `.env.local`

```bash
cat .gitignore | grep -i "\.env"
```

Should show:
```
.env
.env.local
.env.*.local
```

### Step 4: Test Locally

Open `msc-survey.html` in your browser. You should see:

```
✅ Environment variables loaded from .env.local
✅ All required configuration validated
```

## 🚀 Deployment

### For Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Set environment variables:
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   # Paste your Firebase API key
   # Repeat for all VITE_* variables
   ```
3. Deploy:
   ```bash
   vercel --prod
   ```

### For Netlify

1. Go to **Netlify Dashboard** → **Site Settings** → **Build & Deploy** → **Environment**
2. Click **Edit Variables**
3. Add each `VITE_*` variable and its value
4. Redeploy your site

### For Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Set environment variables in `.env` (local only, not committed):
   ```bash
   firebase functions:config:set \
     firebase.api_key="YOUR_API_KEY" \
     firebase.auth_domain="YOUR_DOMAIN"
   ```
3. Deploy:
   ```bash
   firebase deploy
   ```

### For GitHub Pages (Static Hosting)

Since GitHub Pages only serves static files, use Netlify or Vercel instead (they support environment variables).

If you must use GitHub Pages, use a **backend service** to handle credentials:
- ✅ Frontend: Only stores safe values (URLs, public keys)
- ✅ Backend: Stores and manages sensitive credentials (API keys, secrets)

## 🔍 How It Works

### Development Flow

```
1. Browser loads msc-survey.html
2. env-loader.js runs first
3. Reads .env.local file
4. Parses VITE_* variables
5. Injects into window.__ENV__
6. ConfigManager reads window.__ENV__
7. App uses configManager.get('KEY')
```

### Build-Time Flow (With Vite/Webpack)

```
1. Build tool loads .env.local
2. Replaces variables at build time
3. Injects into compiled HTML/JS
4. No .env.local needed at runtime
```

### Production Flow

```
1. Hosting platform (Vercel, Netlify) has env vars
2. Build tool loads from platform
3. Injects at deployment time
4. Static files served without .env.local
```

## ✅ Checklist

- [ ] Created `.env.local` from `.env.example`
- [ ] Filled in all `VITE_*` values with your Firebase credentials
- [ ] `.env.local` is in `.gitignore` (never committed)
- [ ] `.env.example` is in git (for team reference)
- [ ] `env-loader.js` is in your project
- [ ] `msc-survey.html` has `<script src="env-loader.js"></script>` in head
- [ ] Browser console shows "✅ Environment variables loaded" when running locally
- [ ] Browser console shows "✅ All required configuration validated"

## 🚨 DO's and DON'Ts

| ✅ DO | ❌ DON'T |
|------|---------|
| Commit `.env.example` | Commit `.env.local` |
| Commit `.gitignore` | Hardcode credentials in HTML |
| Use env variables for config | Store secrets in localStorage |
| Update `.env.example` with new keys | Share `.env.local` in slack/email |
| Rotate API keys regularly | Use same key for dev & prod |

## 🔑 Firebase Web SDK Keys vs Server Keys

### Web SDK Key (Safe to expose)
- ✅ Restricted to specific domains
- ✅ Can only be used for sign-in, not backend access
- ✅ Can be exposed in frontend code
- 📌 Used in this project

### Service Account Key (NEVER expose)
- ❌ Gives full backend access
- ❌ Can delete databases, modify rules
- ❌ Keep in `.gitignore`
- 📌 For backend use only (Cloud Functions)

## 📞 Troubleshooting

### "Missing required configuration" error

**Check:**
```bash
# Verify .env.local exists
cat .env.local

# Verify variables have VITE_ prefix
grep "VITE_" .env.local

# Verify format: KEY=VALUE (no spaces around =)
```

### Variables not loading in browser

**Check Developer Console:**
```javascript
// Should show your config
console.log(window.__ENV__)

// Should work
console.log(configManager.get('FIREBASE_API_KEY'))
```

### "env-loader.js not found"

**Fix:**
```bash
# Ensure env-loader.js is in same directory as msc-survey.html
ls -la env-loader.js

# Update script path if needed
# <script src="./env-loader.js"></script>
```

## 📚 Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Web SDK Docs](https://firebase.google.com/docs/web)

---

**Questions?** Check your browser console for detailed error messages and follow the setup steps above.
