# How VITE Environment Variables are Called in msc-survey.html

## Answer: Using ConfigManager Methods

The VITE environment variables are **NOT** called directly. Instead, they're accessed through the `ConfigManager` class using getter methods.

---

## The Pattern

### Instead of this (direct access):
```javascript
❌ WRONG - Don't do this
const url = import.meta.env.VITE_BACKEND_URL  // Vite syntax
const url = process.env.VITE_BACKEND_URL      // Node.js syntax
const url = window.VITE_BACKEND_URL           // Global access
```

### You do this (ConfigManager):
```javascript
✅ CORRECT - This is what msc-survey.html does
const backendUrl = configManager.getBackendUrl();
```

---

## Where They're Used

### 1. **In `checkIfUserSubmitted()` Function** (Line 1102)

```javascript
async function checkIfUserSubmitted(userId) {
  try {
    // Check backend to see if user already submitted
    const backendUrl = configManager.getBackendUrl();  // ← GET BACKEND URL
    const response = await fetch(`${backendUrl}/checkSubmission`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      console.warn('⚠️ Could not verify submission status');
      return;
    }

    const data = await response.json();
    // ... rest of function
  } catch (error) {
    // ... error handling
  }
}
```

**What it does:**
- Gets `VITE_BACKEND_URL` from ConfigManager
- Calls the `/checkSubmission` endpoint
- Checks if user already submitted the survey

---

### 2. **In Form Submission Handler** (Line 1269)

```javascript
document.getElementById('surveyForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // ... validation code ...

  try {
    // Collect form data
    const formData = new FormData(e.target);
    const responses = Object.fromEntries(formData);

    // ... validation ...

    const submissionData = {
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name,
      timestamp: new Date().toISOString(),
      ...responses
    };

    console.log('📤 Submitting survey data...');

    // Submit to backend
    const backendUrl = configManager.getBackendUrl();  // ← GET BACKEND URL
    const response = await fetch(`${backendUrl}/submitSurvey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Survey submitted successfully:', result);

    hasSubmitted = true;
    showSuccessPage();

  } catch (error) {
    console.error('❌ Submission error:', error);
    showStatus(`Failed to submit survey: ${error.message}`, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
  }
});
```

**What it does:**
- Gets `VITE_BACKEND_URL` from ConfigManager
- Calls the `/submitSurvey` endpoint
- Submits the survey responses
- Shows success or error message

---

## The ConfigManager Methods

The available methods are:

```javascript
// Get a single credential value
configManager.get('FIREBASE_PROJECT_ID')
// → Returns: "your-project-id"

// Get all credentials as object
configManager.getAll()
// → Returns: { FIREBASE_API_KEY: "...", ... }

// Get Firebase config for firebase.initializeApp()
configManager.getFirebaseConfig()
// → Returns: { apiKey: "...", authDomain: "...", ... }

// Get backend URL specifically
configManager.getBackendUrl()
// → Returns: "https://us-central1-your-project.cloudfunctions.net"
```

---

## The ConfigManager Class (Overview)

```javascript
class ConfigManager {
  constructor() {
    this.config = {};
    this.loadConfig();      // Load from .env.local or window.__ENV__
    this.validateConfig();  // Ensure all 7 credentials exist
  }

  get(key) {
    // Gets a single credential by key name
    // Used for individual values
  }

  getAll() {
    // Returns all loaded credentials as object
  }

  getFirebaseConfig() {
    // Returns Firebase-formatted config object
    // Used with firebase.initializeApp()
  }

  getBackendUrl() {
    // Returns backend URL
    // Used in fetch calls to Cloud Functions
  }

  validateConfig() {
    // Checks all 7 required credentials are present
    // Shows error if any missing
  }
}
```

---

## How It All Works Together

```
1. Page loads
   ↓
2. env-loader.js runs
   - Reads .env.local
   - Finds all VITE_* variables
   - Injects into window.__ENV__
   ↓
3. ConfigManager initializes
   - Reads window.__ENV__
   - Validates all 7 credentials exist
   ↓
4. When form submitted or user checked:
   - Code calls: configManager.getBackendUrl()
   - ConfigManager returns: VITE_BACKEND_URL value
   - Code uses URL in fetch() call
   ↓
5. Cloud Functions receive request
   - Process survey data
   - Return response
   ↓
6. App shows success/error
```

---

## Why This Pattern?

### Benefits of using ConfigManager instead of direct access:

| Feature | Reason |
|---------|--------|
| **Centralized** | One place to manage credentials |
| **Validated** | Checks all required values on startup |
| **Safe** | Never exposes credentials in logs |
| **Flexible** | Works with multiple config sources |
| **Clear errors** | Shows helpful message if config missing |
| **Type-safe** | Getter methods vs string keys |

---

## The 7 Credentials and How They're Used

| Credential | Method | Used For |
|---|---|---|
| `FIREBASE_API_KEY` | `getFirebaseConfig()` | Firebase SDK authentication |
| `FIREBASE_AUTH_DOMAIN` | `getFirebaseConfig()` | OAuth redirects |
| `FIREBASE_PROJECT_ID` | `getFirebaseConfig()` | Firestore database |
| `FIREBASE_STORAGE_BUCKET` | `getFirebaseConfig()` | Cloud Storage |
| `FIREBASE_MESSAGING_SENDER_ID` | `getFirebaseConfig()` | Cloud Messaging |
| `FIREBASE_APP_ID` | `getFirebaseConfig()` | App identification |
| `BACKEND_URL` | `getBackendUrl()` | Cloud Functions API calls |

---

## Example: Complete Flow

### In msc-survey.html:

```javascript
// User clicks submit button
document.getElementById('surveyForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // ... collect form data ...

  // 1. Get backend URL from ConfigManager
  const backendUrl = configManager.getBackendUrl();
  // configManager returns: "https://us-central1-your-project.cloudfunctions.net"
  
  // 2. Make API call
  const response = await fetch(`${backendUrl}/submitSurvey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(surveyData)
  });
  
  // 3. Handle response
  if (response.ok) {
    showSuccessPage();
  } else {
    showErrorMessage();
  }
});
```

**Step by step:**
1. `configManager.getBackendUrl()` reads `VITE_BACKEND_URL` from `.env.local`
2. Returns the actual URL: `https://us-central1-your-project.cloudfunctions.net`
3. Code uses it in the `fetch()` call
4. Request sent to Cloud Functions backend
5. Backend processes survey and stores in Firestore

---

## In Browser Console

You can verify this works:

```javascript
// See all loaded config
window.__ENV__
// → Shows all VITE_* variables from .env.local

// Get a specific credential
configManager.get('FIREBASE_PROJECT_ID')
// → "your-project-id"

// Get backend URL
configManager.getBackendUrl()
// → "https://us-central1-your-project.cloudfunctions.net"

// Get Firebase config (formatted for firebase.initializeApp())
configManager.getFirebaseConfig()
// → { apiKey: "AIzaSyD...", authDomain: "...", ... }
```

---

## Summary

**How VITE variables are called:**

```javascript
// ❌ NOT like this (direct access)
const url = import.meta.env.VITE_BACKEND_URL

// ✅ Like this (through ConfigManager)
const url = configManager.getBackendUrl()

// Both return the same value, but ConfigManager:
// - Validates on startup
// - Works in static HTML
// - Provides clear error messages
// - Is more maintainable
```

---

## Key Takeaway

The VITE naming convention (`VITE_*`) is just a convention. The variables are loaded and called via **ConfigManager methods**, not directly. This provides:

- ✅ Security (no direct env access)
- ✅ Validation (checks all exist)
- ✅ Flexibility (works with static HTML)
- ✅ Clarity (dedicated methods)
