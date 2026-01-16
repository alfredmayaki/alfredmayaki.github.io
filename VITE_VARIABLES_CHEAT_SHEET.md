# VITE Variables - Quick Cheat Sheet

## TL;DR - How They're Called

```javascript
// In msc-survey.html, line 1102 and line 1269:
const backendUrl = configManager.getBackendUrl();

// That's it! That retrieves VITE_BACKEND_URL from .env.local
```

---

## The 3-Second Answer

| Question | Answer |
|----------|--------|
| Where are they called? | **Line 1102** (check submission) and **Line 1269** (submit survey) |
| How are they called? | **`configManager.getBackendUrl()`** |
| What does it return? | **The value of `VITE_BACKEND_URL` from `.env.local`** |
| What VITE vars are used? | **Only `VITE_BACKEND_URL`** (used twice) |
| Other VITE vars? | **For Firebase config object only** (through `getFirebaseConfig()`) |

---

## One-Liner Per Location

### Location 1 - Line 1102
```javascript
const backendUrl = configManager.getBackendUrl();
const response = await fetch(`${backendUrl}/checkSubmission`, { method: 'POST', body: JSON.stringify({ userId }) });
```

### Location 2 - Line 1269
```javascript
const backendUrl = configManager.getBackendUrl();
const response = await fetch(`${backendUrl}/submitSurvey`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionData) });
```

---

## The ConfigManager Methods

```javascript
// Get a single value
configManager.get('FIREBASE_PROJECT_ID')
// → "your-project-id"

// Get backend URL specifically (THIS is used in msc-survey.html)
configManager.getBackendUrl()
// → "https://us-central1-your-project.cloudfunctions.net"

// Get Firebase config object
configManager.getFirebaseConfig()
// → { apiKey: "...", authDomain: "...", projectId: "...", ... }

// Get all credentials
configManager.getAll()
// → { FIREBASE_API_KEY: "...", BACKEND_URL: "...", ... }
```

---

## Visual: Two Uses in msc-survey.html

```
msc-survey.html
│
├─ Line 1102: checkIfUserSubmitted()
│  └─ const backendUrl = configManager.getBackendUrl()
│     └─ Used in: fetch(`${backendUrl}/checkSubmission`, ...)
│
└─ Line 1269: Form submit event
   └─ const backendUrl = configManager.getBackendUrl()
      └─ Used in: fetch(`${backendUrl}/submitSurvey`, ...)
```

---

## What Gets Called

```
VITE_BACKEND_URL in .env.local
        ↓
env-loader.js reads it
        ↓
window.__ENV__.BACKEND_URL
        ↓
configManager.config['BACKEND_URL']
        ↓
configManager.getBackendUrl() returns it
        ↓
const backendUrl = "https://us-central1-..."
        ↓
fetch(`${backendUrl}/submitSurvey`, ...)
```

---

## From .env.local Perspective

```env
# Your .env.local file:

VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123...
VITE_BACKEND_URL=https://us-central1-your-project.cloudfunctions.net  ← USED HERE
                                                                         ├─ Line 1102
                                                                         └─ Line 1269
```

---

## Test in Console

After page loads, verify it works:

```javascript
// See all loaded vars
window.__ENV__

// Get backend URL like the code does
configManager.getBackendUrl()

// Should return something like:
// "https://us-central1-supa-73a39.cloudfunctions.net"
```

---

## The Purpose

### Line 1102 (Check Submission)
- Calls: `/checkSubmission` endpoint
- Checks if user already submitted
- Prevents duplicate submissions

### Line 1269 (Submit Survey)
- Calls: `/submitSurvey` endpoint
- Submits all responses
- Stores in Firestore

---

## Code Pattern

Both locations follow the same pattern:

```javascript
// 1. Get URL
const backendUrl = configManager.getBackendUrl();

// 2. Make fetch call
const response = await fetch(`${backendUrl}/[endpoint]`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// 3. Handle response
if (!response.ok) {
  throw new Error(...);
}
const data = await response.json();
// ... use data ...
```

---

## Production: How It Changes

### Development (.env.local)
```
env-loader.js reads .env.local
    ↓
Injects into window.__ENV__
    ↓
ConfigManager loads from window.__ENV__
```

### Production (Deployed)
```
Build tool (Vercel/Netlify) reads env vars from platform
    ↓
Injects into window.__ENV__ at build time
    ↓
ConfigManager loads from window.__ENV__
```

Result: **No code changes needed!**

---

## Summary

| What | Where | How |
|-----|-------|-----|
| VITE_BACKEND_URL | `.env.local` | Your config |
| env-loader.js | `msc-survey.html` head | Reads .env.local |
| window.__ENV__ | Browser memory | Stores variables |
| ConfigManager | `msc-survey.html` script | Reads window.__ENV__ |
| getBackendUrl() | ConfigManager class | Returns VITE_BACKEND_URL |
| Line 1102 | checkIfUserSubmitted() | Calls /checkSubmission |
| Line 1269 | Form submit | Calls /submitSurvey |

---

## Quick Reference Card

```
┌─────────────────────────────────────┐
│ How VITE Variables Are Called       │
├─────────────────────────────────────┤
│ const url = configManager.get       │
│            ManagergetBackendUrl()   │
│                                     │
│ This is used in:                    │
│  • Line 1102: Check submission      │
│  • Line 1269: Submit survey         │
│                                     │
│ Both use same pattern:              │
│  fetch(`${url}/endpoint`, {...})   │
└─────────────────────────────────────┘
```

---

## Files to Reference

- **This file**: Quick reference
- `VITE_VARIABLES_COMPLETE_REFERENCE.md`: Full details with code
- `VITE_VARIABLES_VISUAL_GUIDE.md`: Diagrams and flow
- `VITE_ENVIRONMENT_VARIABLES_EXPLAINED.md`: Deep explanation

---

**That's it! VITE variables are called via `configManager.getBackendUrl()` at lines 1102 and 1269.**
