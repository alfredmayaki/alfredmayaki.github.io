# The 7 Firebase Credentials - What They Do

## Overview

All 7 credentials work together to enable secure authentication and data storage for your survey app.

```
Firebase Config (7 parts)
├── 1. API Key
├── 2. Auth Domain  
├── 3. Project ID
├── 4. Storage Bucket
├── 5. Messaging Sender ID
├── 6. App ID
└── 7. Backend URL (custom)
```

## Detailed Breakdown

### 1️⃣ **VITE_FIREBASE_API_KEY**

**Format:** `AIzaSyD...` (long alphanumeric)

**What it does:**
- Identifies your Firebase project to Google's servers
- Restricted to your domain (can't be used from other domains)
- Public key - safe to expose in frontend code

**In your `.env.local`:**
```env
VITE_FIREBASE_API_KEY=AIzaSyD_your_actual_key_here
```

**Used by:**
- Firebase SDK initialization
- Authentication requests
- Database read/write operations

---

### 2️⃣ **VITE_FIREBASE_AUTH_DOMAIN**

**Format:** `your-project.firebaseapp.com`

**What it does:**
- Domain where Firebase handles authentication
- Redirects for sign-in flows (Google, LinkedIn)
- Must match your Firebase project settings

**In your `.env.local`:**
```env
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
```

**Used by:**
- OAuth sign-in redirects
- Email/password authentication
- Account recovery flows

---

### 3️⃣ **VITE_FIREBASE_PROJECT_ID**

**Format:** `your-project-id` (alphanumeric, no spaces)

**What it does:**
- Unique identifier for your Firebase project
- References your Firestore database
- Used in security rules

**In your `.env.local`:**
```env
VITE_FIREBASE_PROJECT_ID=your-project-id
```

**Used by:**
- Firestore database operations
- Cloud Functions
- Security rules evaluation

---

### 4️⃣ **VITE_FIREBASE_STORAGE_BUCKET**

**Format:** `your-project.appspot.com`

**What it does:**
- Firebase Cloud Storage endpoint
- Store files (images, documents, etc.)
- Optional - only needed if uploading files

**In your `.env.local`:**
```env
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

**Used by:**
- File uploads
- File downloads
- File management

**For this survey:** Not strictly needed yet, but good to have configured

---

### 5️⃣ **VITE_FIREBASE_MESSAGING_SENDER_ID**

**Format:** `123456789012` (11-12 digits)

**What it does:**
- Enables Firebase Cloud Messaging (FCM)
- Send push notifications to users
- Optional - only needed for notifications

**In your `.env.local`:**
```env
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
```

**Used by:**
- Push notifications
- Real-time messaging
- Service workers

**For this survey:** Not needed now, optional for future notifications

---

### 6️⃣ **VITE_FIREBASE_APP_ID**

**Format:** `1:123456789012:web:abc123def456` (specific format)

**What it does:**
- Unique identifier for your web app
- Links configuration to your app instance
- Part of Firebase initialization

**In your `.env.local`:**
```env
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

**Used by:**
- Firebase SDK initialization
- Analytics
- App identification

---

### 7️⃣ **VITE_BACKEND_URL** (Custom)

**Format:** `https://us-central1-your-project.cloudfunctions.net`

**What it does:**
- Your Cloud Functions endpoint
- Backend for survey submission
- Validates Firebase ID tokens
- Stores responses in Firestore

**In your `.env.local`:**
```env
VITE_BACKEND_URL=https://us-central1-your-project.cloudfunctions.net
```

**Used by:**
- Survey form submission
- User authentication check
- Database operations on backend

---

## How They Work Together

### During Sign-In
```
User clicks "Sign in with Google"
           ↓
env-loader.js loads credentials
           ↓
ConfigManager provides VITE_FIREBASE_AUTH_DOMAIN
           ↓
Firebase redirects to Google OAuth
           ↓
User authenticates
           ↓
Firebase returns ID token
```

### During Survey Submission
```
User submits survey form
           ↓
App gets ID token from Firebase
           ↓
App sends token + responses to VITE_BACKEND_URL
           ↓
Cloud Function verifies token using VITE_FIREBASE_API_KEY
           ↓
Backend stores survey in Firestore (VITE_FIREBASE_PROJECT_ID)
           ↓
Success message displayed
```

## Security Properties

| Credential | Public? | Expiration | Rotation |
|------------|---------|-----------|----------|
| API Key | ✅ Yes (restricted by domain) | None | Manual in Firebase Console |
| Auth Domain | ✅ Yes (domain name) | None | Update in Firebase Config |
| Project ID | ✅ Yes (public identifier) | None | Can't change |
| Storage Bucket | ✅ Yes (domain name) | None | Fixed to project |
| Messaging ID | ✅ Yes (public identifier) | None | Fixed to project |
| App ID | ✅ Yes (public identifier) | None | Fixed to app |
| Backend URL | ✅ Yes (public endpoint) | None | Change if URL changes |

## Where to Find These Values

### Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **⚙️** (Settings) → **Project Settings**
4. Select your **Web App**
5. Copy config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",                    // #1
  authDomain: "your-project.firebaseapp.com", // #2
  projectId: "your-project-id",           // #3
  storageBucket: "your-project.appspot.com", // #4
  messagingSenderId: "123456789012",      // #5
  appId: "1:123456789012:web:abc123..."   // #6
};
```

### Backend URL

From your Cloud Functions deployment:
```
Cloud Functions > Your function > Trigger tab > URL
https://us-central1-your-project.cloudfunctions.net/submitSurvey
```

## What Each Credential Is NOT

### ❌ NOT a Password
- Don't treat like a password
- Can be public (with restrictions)
- Can be rotated/regenerated

### ❌ NOT a Server Secret
- Server secrets stay in `.env` file
- Web SDK keys are for frontend use
- Different from Service Account keys

### ❌ NOT Personal Data
- Doesn't identify users
- Doesn't contain user information
- Doesn't store user passwords

## Credential Validation

ConfigManager validates that all 7 are present:

```javascript
const required = [
  'FIREBASE_API_KEY',           // ✅ #1
  'FIREBASE_AUTH_DOMAIN',       // ✅ #2
  'FIREBASE_PROJECT_ID',        // ✅ #3
  'FIREBASE_STORAGE_BUCKET',    // ✅ #4
  'FIREBASE_MESSAGING_SENDER_ID', // ✅ #5
  'FIREBASE_APP_ID',            // ✅ #6
  'BACKEND_URL'                 // ✅ #7
];
```

If any are missing, you'll see an error with clear instructions.

## Testing Your Credentials

```javascript
// In browser console:

// Check all loaded
configManager.getAll()
// Should show all 7 values

// Check Firebase config builds correctly
const fbConfig = configManager.getFirebaseConfig()
// Should have: apiKey, authDomain, projectId, etc.

// Check backend URL
configManager.getBackendUrl()
// Should show: https://us-central1-your-project.cloudfunctions.net

// Try initializing Firebase (if not already done)
firebase.initializeApp(fbConfig)
// Should initialize without errors
```

## Reference Table

| # | Env Variable | Value | Length | Required | Used For |
|---|---|---|---|---|---|
| 1 | `VITE_FIREBASE_API_KEY` | `AIzaSyD...` | ~40 chars | ✅ Yes | SDK Auth |
| 2 | `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Variable | ✅ Yes | OAuth redirect |
| 3 | `VITE_FIREBASE_PROJECT_ID` | `your-project-id` | Variable | ✅ Yes | Firestore |
| 4 | `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | Variable | ✅ Yes | Cloud Storage |
| 5 | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | 12 digits | ✅ Yes | FCM (future) |
| 6 | `VITE_FIREBASE_APP_ID` | `1:123456789012:web:abc...` | Variable | ✅ Yes | SDK Init |
| 7 | `VITE_BACKEND_URL` | `https://us-central1-...` | Variable | ✅ Yes | Backend API |

## Troubleshooting Credentials

### Credential Not Found
```bash
# Check .env.local has the variable
grep "VITE_FIREBASE_API_KEY" .env.local

# Check format: KEY=VALUE (no spaces around =)
cat .env.local | head -1

# Reload browser to pick up changes
```

### Wrong Value
```bash
# Verify from Firebase Console
# 1. Go to Project Settings
# 2. Copy exact value
# 3. Paste into .env.local
# 4. Save file
# 5. Reload browser
```

### Credentials Changed
```bash
# If you regenerated API key in Firebase:
# 1. Get new value from Firebase Console
# 2. Update in .env.local
# 3. Update in production platform dashboard
# 4. Redeploy/reload
```

---

## Summary

All 7 credentials work together to:
1. ✅ Authenticate users (Google, LinkedIn)
2. ✅ Store survey responses (Firestore)
3. ✅ Validate submission tokens (Backend)
4. ✅ Handle file uploads (Cloud Storage)
5. ✅ Enable notifications (FCM)

**Your survey app needs all 7 to function fully!**
