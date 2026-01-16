# 🔐 Google OAuth 2.0 Configuration Guide

## Quick Setup (5 minutes)

### Step 1: Get Your Google Client ID

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Create a New Project:**
   - Click "Select a Project" → "New Project"
   - Name: `MSc Survey`
   - Click "Create"

3. **Enable APIs:**
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - ✅ Google Sheets API
     - ✅ Google Drive API
     - ✅ Cloud Firestore API

4. **Create OAuth 2.0 Credentials:**
   - Go to "Credentials" in left sidebar
   - Click "Create Credentials" → "OAuth Client ID"
   - If prompted: Click "Configure Consent Screen"
     - User Type: **External**
     - App name: `MSc Survey - Neurodiversity Research`
     - Support email: your email
     - Click "Save and Continue" → "Save and Continue" → "Back to Dashboard"

5. **Create OAuth Client:**
   - Click "Create Credentials" → "OAuth Client ID"
   - Application type: **Web application**
   - Name: `MSc Survey Frontend`
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     http://localhost:8000
     http://127.0.0.1:3000
     https://alfredmayaki.me
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000
     http://localhost:8000
     http://127.0.0.1:3000
     https://alfredmayaki.me
     https://alfredmayaki.me/msc-survey.html
     ```
   - Click "Create"

6. **Copy Your Client ID:**
   - A popup will show your credentials
   - Copy the **Client ID** (looks like: `123456789-abcd1234xyz.apps.googleusercontent.com`)

---

### Step 2: Configure msc-survey.html

1. **Open msc-survey.html** in your text editor

2. **Find the CONFIG section** (around line 530):
   ```javascript
   const CONFIG = {
     GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com',
     BACKEND_URL: 'https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net',
     ENABLE_DEMO_MODE: false
   };
   ```

3. **Replace `YOUR_GOOGLE_CLIENT_ID_HERE`** with your actual Client ID:
   ```javascript
   const CONFIG = {
     GOOGLE_CLIENT_ID: '123456789-abcd1234xyz.apps.googleusercontent.com',  // ← Your real ID
     BACKEND_URL: 'https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net',
     ENABLE_DEMO_MODE: false
   };
   ```

4. **Save the file**

---

### Step 3: Test Locally (Optional)

```bash
# Start a local web server
python -m http.server 3000

# Or with Node.js
npx http-server -p 3000

# Visit: http://localhost:3000/msc-survey.html
```

---

### Step 4: Deploy to GitHub

```bash
# Stage changes
git add msc-survey.html

# Commit
git commit -m "Configure Google OAuth 2.0 Client ID for survey"

# Push
git push origin main

# Visit: https://alfredmayaki.me/msc-survey.html
```

---

## Testing the OAuth Login

### ✅ What Should Happen

1. **Visit msc-survey.html**
   - See "Sign in with Google" button

2. **Click "Sign in with Google"**
   - Google popup opens
   - Sign in with your Google account
   - Popup closes

3. **After Login:**
   - Your name and profile picture appear in header
   - Survey form displays
   - Progress bar shows 0/7

4. **Logout:**
   - Click "Logout" button
   - Redirected to homepage

---

## ❌ Troubleshooting

### Problem: "Sign in with Google" button not showing

**Solution 1: Check Client ID**
```javascript
// Open browser console (F12)
console.log(CONFIG.GOOGLE_CLIENT_ID);
// Should show your actual Client ID, NOT "YOUR_GOOGLE_CLIENT_ID_HERE"
```

**Solution 2: Add to Authorized Origins**
- Google Cloud Console → Credentials
- Click your OAuth client
- Add these to "Authorized JavaScript origins":
  ```
  http://localhost:3000
  https://alfredmayaki.me
  ```

**Solution 3: Clear Browser Cache**
```
Ctrl + Shift + Delete (or Cmd + Shift + Delete on Mac)
Clear cache → Reload page
```

---

### Problem: "Popup blocked" error

**Solution:**
- Check if pop-ups are blocked
- Allow pop-ups for alfredmayaki.me
- Try signing in again

---

### Problem: "CORS error" when trying to submit

**This is expected at first.** It means:
- Frontend is working ✅
- Google OAuth is working ✅
- Backend (Cloud Functions) not yet set up ⏳

**Next step:** Follow MSC_SURVEY_SETUP.md to deploy Cloud Functions

---

## Feature: Demo Mode (For Testing Without Auth)

If you want to test the form without Google authentication:

```javascript
const CONFIG = {
  GOOGLE_CLIENT_ID: '...',
  BACKEND_URL: '...',
  ENABLE_DEMO_MODE: true  // ← Set to true
};
```

With `ENABLE_DEMO_MODE: true`:
- Login button hidden
- Survey form shows immediately
- User info shows as "Demo User"
- Submission disabled (to prevent fake data)

---

## Security Reminders

⚠️ **DO:**
- ✅ Use different Client IDs for dev/prod
- ✅ Add appropriate redirect URIs
- ✅ Restrict API keys
- ✅ Rotate credentials quarterly
- ✅ Monitor Cloud Logging

⚠️ **DON'T:**
- ❌ Commit real Client IDs to version control
- ❌ Use wildcard (*) for authorized origins
- ❌ Share credentials publicly
- ❌ Use same credentials for all projects

---

## Next: Backend Setup

Once OAuth login is working, follow **MSC_SURVEY_SETUP.md** to:
1. Create Firebase project
2. Deploy Cloud Functions
3. Connect to Google Sheets
4. Enable survey submission

---

## Quick Reference

| Item | Where to Find |
|------|---------------|
| Google Client ID | Google Cloud Console → Credentials |
| Backend URL | Firebase Console → Functions |
| Sheet ID | Google Sheets URL bar |
| OAuth Scopes | `profile`, `email` (default) |
| Token Expiry | 1 hour (Google handles refresh) |

---

**Status: OAuth 2.0 configured and ready to test!** 🚀
