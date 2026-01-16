# Quick Visual Reference: VITE Variables in msc-survey.html

## The Two Places They're Used

### Location 1: Checking If User Already Submitted

**File:** `msc-survey.html` (Line 1102)

```
┌─────────────────────────────────────────┐
│ checkIfUserSubmitted(userId)            │
└─────────────────────────────────────────┘
           ↓
   const backendUrl = configManager.getBackendUrl()
   // Gets: VITE_BACKEND_URL from .env.local
   // Returns: "https://us-central1-your-project..."
           ↓
   fetch(`${backendUrl}/checkSubmission`, {
     method: 'POST',
     body: { userId }
   })
           ↓
   Cloud Functions processes request
           ↓
   Response: { hasSubmitted: true/false }
```

---

### Location 2: Submitting Survey Responses

**File:** `msc-survey.html` (Line 1269)

```
┌─────────────────────────────────────────┐
│ Form Submit Event Listener              │
└─────────────────────────────────────────┘
           ↓
   Collect form data (q1, q2, q3, etc.)
           ↓
   Validate required fields
           ↓
   const backendUrl = configManager.getBackendUrl()
   // Gets: VITE_BACKEND_URL from .env.local
   // Returns: "https://us-central1-your-project..."
           ↓
   fetch(`${backendUrl}/submitSurvey`, {
     method: 'POST',
     body: { userId, responses, etc. }
   })
           ↓
   Cloud Functions stores in Firestore
           ↓
   Response: { success: true/false }
           ↓
   Show success page
```

---

## The Code Snippets Side-by-Side

### Snippet 1 (Line 1102)
```javascript
async function checkIfUserSubmitted(userId) {
  try {
    const backendUrl = configManager.getBackendUrl();  // ← GET URL
    const response = await fetch(`${backendUrl}/checkSubmission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    // ... rest of logic ...
  }
}
```

### Snippet 2 (Line 1269)
```javascript
document.getElementById('surveyForm').addEventListener('submit', async (e) => {
  // ... collect and validate data ...
  
  const backendUrl = configManager.getBackendUrl();  // ← GET URL
  const response = await fetch(`${backendUrl}/submitSurvey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submissionData)
  });
  // ... handle response ...
});
```

---

## What ConfigManager Does

```
.env.local (your file)
    ↓ env-loader.js reads it
window.__ENV__ (injected into browser)
    ↓ ConfigManager loads from it
ConfigManager class (provides methods)
    ↓ msc-survey.html calls methods
    ├─ configManager.get('KEY')
    ├─ configManager.getBackendUrl()
    ├─ configManager.getFirebaseConfig()
    └─ configManager.getAll()
    ↓ Used in fetch() calls
Cloud Functions API
```

---

## The Variables Involved

### In .env.local (Your File)
```env
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123...
VITE_BACKEND_URL=https://us-central1-your-project.cloudfunctions.net  ← USED HERE
```

### In msc-survey.html (Two Places)

**Place 1:**
```javascript
const backendUrl = configManager.getBackendUrl();  // Line 1102
// Returns: VITE_BACKEND_URL
```

**Place 2:**
```javascript
const backendUrl = configManager.getBackendUrl();  // Line 1269
// Returns: VITE_BACKEND_URL
```

---

## Test in Browser Console

```javascript
// 1. Check if loaded
window.__ENV__
// Shows all 7 VITE_* variables from .env.local

// 2. Check specific value
configManager.get('FIREBASE_PROJECT_ID')
// Returns: "your-project-id"

// 3. Get backend URL directly
configManager.getBackendUrl()
// Returns: "https://us-central1-your-project.cloudfunctions.net"

// 4. Use it (what the code does)
const url = configManager.getBackendUrl();
fetch(`${url}/checkSubmission`, { /* ... */ });
```

---

## Data Flow Diagram

### Checking Submission Status
```
User loads page
    ↓
handleGoogleSignIn() called
    ↓
checkIfUserSubmitted(userId) called
    ↓
const backendUrl = configManager.getBackendUrl()
    ↓ (retrieves VITE_BACKEND_URL from .env.local)
    ↓
fetch(`${backendUrl}/checkSubmission`, { userId })
    ↓ (sends to Cloud Functions)
    ↓
Cloud Functions checks if userId in Firestore
    ↓
Returns: { hasSubmitted: true/false }
    ↓
If true: Show error "Already submitted"
If false: Show survey form
```

### Submitting Survey
```
User fills out survey
    ↓
User clicks "Submit Survey"
    ↓
Form submit event triggered
    ↓
Collect all responses (q1-q7)
    ↓
Validate required fields
    ↓
const backendUrl = configManager.getBackendUrl()
    ↓ (retrieves VITE_BACKEND_URL from .env.local)
    ↓
fetch(`${backendUrl}/submitSurvey`, { responses })
    ↓ (sends to Cloud Functions)
    ↓
Cloud Functions validates token
    ↓
Cloud Functions stores in Firestore
    ↓
Returns: { success: true, submissionId: "..." }
    ↓
Show success page "Thank you!"
```

---

## What Gets Sent

### To `/checkSubmission` Endpoint
```javascript
{
  userId: "google_user_id_123"
}
```

### To `/submitSurvey` Endpoint
```javascript
{
  userId: "google_user_id_123",
  userEmail: "user@example.com",
  userName: "John Doe",
  timestamp: "2024-01-15T10:30:00.000Z",
  q1: "User's answer to question 1",
  q2: "User's answer to question 2",
  q2a: "User's answer to sub-question 2a",
  q3: "User's answer to question 3",
  q3a: "User's answer to sub-question 3a",
  q4: "User's answer to question 4",
  q4a: "User's answer to sub-question 4a",
  q5: "User's answer to question 5",
  q6: "User's answer to question 6",
  q6a: "User's answer to sub-question 6a",
  q7: "User's optional answer to question 7"
}
```

---

## Error Handling

### If Backend URL is Missing
```javascript
configManager.getBackendUrl() 
// Returns: null

fetch(`${null}/submitSurvey`, {...})
// Error: Invalid URL
```

### If Backend URL is Invalid
```javascript
fetch(`https://wrong-url/submitSurvey`, {...})
// Error: Failed to fetch (CORS or 404)
```

### Actual Error Handling in Code
```javascript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || `Server error: ${response.statusText}`);
}
```

---

## Summary Table

| Item | Location | Line | Purpose |
|------|----------|------|---------|
| checkIfUserSubmitted() | msc-survey.html | 1102 | Get backend URL for submission check |
| Form submit handler | msc-survey.html | 1269 | Get backend URL for survey submission |
| getBackendUrl() | ConfigManager | ~880 | Method to retrieve VITE_BACKEND_URL |
| VITE_BACKEND_URL | .env.local | Line 7 | Actual Cloud Functions endpoint |

---

## What Happens If You Change the URL

### In .env.local:
```env
# OLD
VITE_BACKEND_URL=https://us-central1-project1.cloudfunctions.net

# NEW
VITE_BACKEND_URL=https://us-central1-project2.cloudfunctions.net
```

### Result:
1. Reload browser
2. env-loader.js reads new URL
3. ConfigManager loads new URL
4. `configManager.getBackendUrl()` returns new URL
5. All fetch() calls use new URL automatically
6. No code changes needed!

This is why using ConfigManager is powerful - change one file, everything updates.

---

## Key Point

The **VITE naming is just a convention**. What matters is:
- ✅ Variables are in `.env.local`
- ✅ env-loader.js reads them
- ✅ ConfigManager provides access
- ✅ Code calls `configManager.getBackendUrl()`
- ✅ Backend URL is used in fetch() calls

That's the complete flow!
