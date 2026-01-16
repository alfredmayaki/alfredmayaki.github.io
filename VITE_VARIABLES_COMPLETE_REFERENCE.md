# VITE Variables in msc-survey.html - Complete Reference

## Quick Answer

The VITE variables (`VITE_BACKEND_URL` etc.) are called using **ConfigManager methods**:

```javascript
// How they're called
const backendUrl = configManager.getBackendUrl();

// Two places in msc-survey.html:
// 1. Line 1102 - checkIfUserSubmitted()
// 2. Line 1269 - Form submission
```

---

## Exact Line-by-Line Usage

### Usage #1: Line 1102 - Check Submission Status

**Context: `checkIfUserSubmitted()` function**

```javascript
1100:      try {
1101:        // Check backend to see if user already submitted
1102:        const backendUrl = configManager.getBackendUrl();  // ← HERE
1103:        const response = await fetch(`${backendUrl}/checkSubmission`, {
1104:          method: 'POST',
1105:          headers: { 
1106:            'Content-Type': 'application/json'
1107:          },
1108:          body: JSON.stringify({ userId })
1109:        });
```

**What it does:**
- Retrieves `VITE_BACKEND_URL` from `.env.local`
- Calls `/checkSubmission` endpoint
- Checks if this user already submitted

**Example URL generated:**
```
https://us-central1-supa-73a39.cloudfunctions.net/checkSubmission
```

---

### Usage #2: Line 1269 - Submit Survey

**Context: Form submission event handler**

```javascript
1250:        const requiredFields = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
1251:        for (const field of requiredFields) {
1252:          if (!responses[field] || responses[field].trim().length === 0) {
1253:            throw new Error(`Required field "${field}" is empty`);
1254:          }
1255:        }
1256:
1257:        const submissionData = {
1258:          userId: currentUser.id,
1259:          userEmail: currentUser.email,
1260:          userName: currentUser.name,
1261:          timestamp: new Date().toISOString(),
1262:          ...responses
1263:        };
1264:
1265:        console.log('📤 Submitting survey data...');
1266:
1267:        // Submit to backend
1268:        const backendUrl = configManager.getBackendUrl();  // ← HERE
1269:        const response = await fetch(`${backendUrl}/submitSurvey`, {
1270:          method: 'POST',
1271:          headers: { 'Content-Type': 'application/json' },
1272:          body: JSON.stringify(submissionData)
1273:        });
```

**What it does:**
- Retrieves `VITE_BACKEND_URL` from `.env.local`
- Calls `/submitSurvey` endpoint
- Submits all survey responses

**Example URL generated:**
```
https://us-central1-supa-73a39.cloudfunctions.net/submitSurvey
```

---

## How the Call Chain Works

### Call Chain: Line 1102

```
1. User authenticates with Google
   ↓
2. handleGoogleSignIn() sets currentUser
   ↓
3. displayUserInfo() updates header
   ↓
4. checkIfUserSubmitted() called with currentUser.id
   ↓
5. Line 1102: configManager.getBackendUrl()
   ├─ ConfigManager looks in this.config
   ├─ Finds: VITE_BACKEND_URL
   ├─ Returns: "https://us-central1-supa-73a39.cloudfunctions.net"
   ↓
6. Line 1103: fetch(`${backendUrl}/checkSubmission`, ...)
   ├─ URL: "https://us-central1-supa-73a39.cloudfunctions.net/checkSubmission"
   ├─ Sends POST with userId
   ├─ Firebase Cloud Function receives request
   ├─ Queries Firestore for this userId
   ├─ Returns: { hasSubmitted: true/false }
   ↓
7. If hasSubmitted === true:
   ├─ Set hasSubmitted = true
   ├─ Show error: "Already completed"
   └─ Don't show form
   
   If hasSubmitted === false:
   ├─ Continue
   ├─ displayUserInfo()
   ├─ showSurveyForm()
   └─ User can see and fill form
```

### Call Chain: Line 1269

```
1. User fills out all 7 questions
   ↓
2. User clicks "Submit Survey" button
   ↓
3. Form submit event triggered
   ↓
4. Lines 1250-1264: Collect and validate responses
   ├─ Get FormData from form
   ├─ Check all required questions filled
   ├─ Build submissionData object
   ↓
5. Line 1268: configManager.getBackendUrl()
   ├─ ConfigManager looks in this.config
   ├─ Finds: VITE_BACKEND_URL
   ├─ Returns: "https://us-central1-supa-73a39.cloudfunctions.net"
   ↓
6. Line 1269: fetch(`${backendUrl}/submitSurvey`, ...)
   ├─ URL: "https://us-central1-supa-73a39.cloudfunctions.net/submitSurvey"
   ├─ Sends POST with all survey responses
   ├─ Firebase Cloud Function receives request
   ├─ Validates user is authenticated
   ├─ Stores survey in Firestore
   ├─ Returns: { success: true, submissionId: "..." }
   ↓
7. Handle response
   ├─ If ok: Line 1289: showSuccessPage()
   └─ If error: Line 1293: showStatus(error)
```

---

## ConfigManager Implementation (Relevant Parts)

### Class Definition (Around Line 801)

```javascript
class ConfigManager {
  constructor() {
    this.config = {};
    this.loadConfig();      // Loads from window.__ENV__
    this.validateConfig();  // Ensures all 7 exist
  }

  /**
   * Get a configuration value safely
   */
  get(key) {
    const value = this.config[key];
    if (!value) {
      console.warn(`⚠️ Config key not found: ${key}`);
      return null;
    }
    return String(value);
  }

  /**
   * Get backend URL
   */
  getBackendUrl() {
    return this.get('BACKEND_URL');  // Looks up 'BACKEND_URL' key
  }

  /**
   * Get Firebase configuration object
   */
  getFirebaseConfig() {
    return {
      apiKey: this.get('FIREBASE_API_KEY'),
      authDomain: this.get('FIREBASE_AUTH_DOMAIN'),
      projectId: this.get('FIREBASE_PROJECT_ID'),
      storageBucket: this.get('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: this.get('FIREBASE_MESSAGING_SENDER_ID'),
      appId: this.get('FIREBASE_APP_ID')
    };
  }
}
```

### Initialization (Around Line 954)

```javascript
let configManager;
try {
  configManager = new ConfigManager();  // Creates instance, loads config
} catch (error) {
  console.error('Configuration initialization failed:', error);
}
```

---

## The Flow: env.local → window.__ENV__ → ConfigManager → Code

```
Step 1: .env.local File (Your Machine)
────────────────────────────────────
VITE_BACKEND_URL=https://us-central1-supa-73a39.cloudfunctions.net
(Plus 6 other VITE_* variables)

Step 2: env-loader.js Loads It (Line 12 in msc-survey.html)
────────────────────────────────────
<script src="env-loader.js"></script>
  ↓
env-loader.js runs:
  1. Checks if localhost (development)
  2. Fetches .env.local file
  3. Parses lines like: VITE_BACKEND_URL=https://...
  4. Extracts key=value pairs
  5. Injects into window.__ENV__

Step 3: window.__ENV__ Contains Loaded Variables
────────────────────────────────────
window.__ENV__ = {
  FIREBASE_API_KEY: "AIzaSyD...",
  FIREBASE_AUTH_DOMAIN: "your-project.firebaseapp.com",
  FIREBASE_PROJECT_ID: "your-project-id",
  FIREBASE_STORAGE_BUCKET: "your-project.appspot.com",
  FIREBASE_MESSAGING_SENDER_ID: "123456789012",
  FIREBASE_APP_ID: "1:123456789012:web:abc123...",
  BACKEND_URL: "https://us-central1-supa-73a39.cloudfunctions.net"
}

Step 4: ConfigManager Reads window.__ENV__
────────────────────────────────────
new ConfigManager():
  this.config = window.__ENV__  // Stores all 7 variables
  this.validateConfig()         // Checks all 7 exist

Step 5: Code Calls ConfigManager Methods
────────────────────────────────────
const backendUrl = configManager.getBackendUrl();
  ↓
configManager.get('BACKEND_URL')
  ↓
return this.config['BACKEND_URL']
  ↓
return "https://us-central1-supa-73a39.cloudfunctions.net"

Step 6: Code Uses Returned Value
────────────────────────────────────
fetch(`${backendUrl}/submitSurvey`, { ... })
  ↓
fetch("https://us-central1-supa-73a39.cloudfunctions.net/submitSurvey", { ... })
  ↓
Request sent to Cloud Functions
```

---

## Production vs Development

### Development (Your Machine)
```
1. env-loader.js reads .env.local
2. Injects into window.__ENV__
3. ConfigManager loads from window.__ENV__
4. Works! ✅
```

### Production (Deployed)
```
1. .env.local doesn't exist (not deployed)
2. Build tool (Vercel, Netlify) injects env vars at build time
3. Injects into window.__ENV__ (or process.env)
4. ConfigManager loads from that
5. Works! ✅
```

---

## Testing in Browser Console

After page loads:

```javascript
// 1. Check env-loader ran
window.__ENV__
// Output:
{
  FIREBASE_API_KEY: "AIzaSyD...",
  FIREBASE_AUTH_DOMAIN: "your-project.firebaseapp.com",
  FIREBASE_PROJECT_ID: "your-project-id",
  FIREBASE_STORAGE_BUCKET: "your-project.appspot.com",
  FIREBASE_MESSAGING_SENDER_ID: "123456789012",
  FIREBASE_APP_ID: "1:123456789012:web:abc123...",
  BACKEND_URL: "https://us-central1-supa-73a39.cloudfunctions.net"
}

// 2. Check ConfigManager initialized
configManager
// Output: ConfigManager { config: { ... }, ... }

// 3. Call getBackendUrl() like the code does
configManager.getBackendUrl()
// Output: "https://us-central1-supa-73a39.cloudfunctions.net"

// 4. This is what gets used in fetch()
const url = configManager.getBackendUrl()
console.log(url)
// Output: "https://us-central1-supa-73a39.cloudfunctions.net"

// 5. This is the full URL that gets called
const url = configManager.getBackendUrl()
console.log(`${url}/submitSurvey`)
// Output: "https://us-central1-supa-73a39.cloudfunctions.net/submitSurvey"
```

---

## Summary

| Item | Details |
|------|---------|
| **Where called** | Line 1102 and Line 1269 in msc-survey.html |
| **How called** | `configManager.getBackendUrl()` |
| **What it retrieves** | `VITE_BACKEND_URL` from `.env.local` |
| **Returns** | Cloud Functions URL string |
| **Used in** | `fetch()` API calls |
| **Endpoints** | `/checkSubmission` and `/submitSurvey` |
| **Purpose #1** | Check if user already submitted (Line 1102) |
| **Purpose #2** | Submit survey responses (Line 1269) |

---

## Complete Example

Here's what actually happens end-to-end:

```javascript
// Line 1102 (when user signs in)
const backendUrl = configManager.getBackendUrl();
// configManager reads: VITE_BACKEND_URL from window.__ENV__
// Returns: "https://us-central1-supa-73a39.cloudfunctions.net"

const response = await fetch(`${backendUrl}/checkSubmission`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: "google_user_id_123" })
});
// Makes request to: 
// POST https://us-central1-supa-73a39.cloudfunctions.net/checkSubmission
// With body: { userId: "google_user_id_123" }

// Cloud Function receives request, checks Firestore
// Returns: { hasSubmitted: false }

// JavaScript receives response
const data = await response.json();  // { hasSubmitted: false }

if (data.hasSubmitted) {
  // User already submitted, show error
  showError('Already submitted');
} else {
  // User can fill form
  showSurveyForm();
}
```

---

## Key Point

The VITE naming (`VITE_BACKEND_URL`) is just a convention. The actual mechanism is:

```
.env.local
    ↓
env-loader.js
    ↓
window.__ENV__
    ↓
ConfigManager
    ↓
configManager.getBackendUrl()
    ↓
fetch() API call
```

That's the complete flow for how VITE environment variables are called in msc-survey.html!
