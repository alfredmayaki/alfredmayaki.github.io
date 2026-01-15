# 📊 Qualtrics OAuth 2.0 Survey Integration Guide

## 📋 Overview

`survey.html` provides a complete Qualtrics OAuth 2.0 authentication integration that:
- ✅ Authenticates with Qualtrics using OAuth 2.0
- ✅ Extracts survey questions from your Qualtrics account
- ✅ Displays surveys in an interactive interface
- ✅ Shows detailed question information with answer choices
- ✅ Supports multiple Qualtrics data centers
- ✅ Stores credentials securely in localStorage
- ✅ Handles token refresh and expiration

---

## 🚀 Quick Start

### **1. Set Up Qualtrics OAuth Credentials**

1. Log into your **Qualtrics Account**
2. Navigate to **Account Settings → OAuth**
3. Click **Create OAuth Application**
4. Fill in the details:
   - **App Name:** Your app name (e.g., "Survey Integration")
   - **Redirect URI:** `https://your-domain.com/survey.html`
5. Copy your **Client ID** and **Client Secret**

### **2. Configure in survey.html**

1. Open `survey.html` on your site
2. Enter your **Client ID** and **Client Secret**
3. Select your **Qualtrics Data Center** (where your account is hosted)
4. Click **Save Credentials**
5. Click **Authenticate with Qualtrics**

### **3. Browse Surveys**

Once authenticated, you'll see:
- ✅ List of all your surveys
- ✅ Survey status (Active/Inactive)
- ✅ Survey IDs
- ✅ View Questions button

---

## 🔐 OAuth 2.0 Flow

```
User clicks "Authenticate"
    ↓
Redirected to Qualtrics authorization page
    ↓
User approves access
    ↓
Qualtrics redirects back with authorization code
    ↓
survey.html exchanges code for access token
    ↓
Token stored in localStorage
    ↓
Can now call Qualtrics API
```

---

## 📚 Features

### **Authentication**
- ✅ OAuth 2.0 authorization code flow
- ✅ Secure token storage
- ✅ Token expiration handling
- ✅ State parameter validation (CSRF protection)
- ✅ Refresh token support

### **Survey Management**
- ✅ List all surveys
- ✅ Display survey status
- ✅ View survey IDs
- ✅ Search/filter surveys

### **Question Extraction**
- ✅ Extract all questions from a survey
- ✅ Display question text
- ✅ Show question types
- ✅ Display answer choices
- ✅ Indicate required questions
- ✅ Support for all Qualtrics question types

### **Data Centers**
Supports all Qualtrics data centers:
- 🇺🇸 **sjc1** - West Coast US
- 🇨🇦 **ca1** - Canada
- 🇪🇺 **eur1** - Europe
- 🌏 **sea1** - Southeast Asia
- 🇦🇺 **aus1** - Australia

---

## 🛠️ Configuration

### **Credentials**

Store securely in localStorage:
```javascript
localStorage.setItem('qlt_client_id', 'YOUR_CLIENT_ID');
localStorage.setItem('qlt_client_secret', 'YOUR_CLIENT_SECRET');
localStorage.setItem('qlt_data_center', 'https://sjc1.qualtrics.com');
```

### **Tokens**

Automatically managed:
```javascript
localStorage.setItem('qlt_access_token', 'TOKEN');
localStorage.setItem('qlt_refresh_token', 'REFRESH_TOKEN');
localStorage.setItem('qlt_expires_at', TIMESTAMP);
```

---

## 📡 API Endpoints Used

### **1. Authorization**
```
GET https://[data-center]/oauth2/authorize
```

### **2. Token Exchange**
```
POST https://[data-center]/oauth2/token
```

### **3. List Surveys**
```
GET https://[data-center]/API/v3/surveys
Headers: Authorization: Bearer {access_token}
```

### **4. Get Survey Questions**
```
GET https://[data-center]/API/v3/surveys/{surveyId}?expand=questions
Headers: Authorization: Bearer {access_token}
```

---

## 🔍 Response Format

### **Surveys Response**
```json
{
  "result": {
    "elements": [
      {
        "id": "SV_xxxxxx",
        "name": "My Survey",
        "isActive": true
      }
    ]
  }
}
```

### **Questions Response**
```json
{
  "result": {
    "questions": [
      {
        "questionText": "How satisfied are you?",
        "questionType": "MC",
        "required": true,
        "choices": {
          "1": { "display": "Very Satisfied" },
          "2": { "display": "Satisfied" }
        }
      }
    ]
  }
}
```

---

## ⚙️ Question Types

| Type | Description |
|------|-------------|
| **MC** | Multiple Choice |
| **MA** | Multiple Answer |
| **TE** | Text Entry |
| **Rank** | Ranking |
| **Rating** | Rating Scale |
| **NPS** | Net Promoter Score |
| **Matrix** | Matrix/Table |
| **Slider** | Slider Scale |
| **Timing** | Page Timer |

---

## 🔒 Security Features

✅ **OAuth 2.0 Standard Flow**
- Authorization code exchange
- Client secret protection
- State parameter validation (CSRF)

✅ **Token Management**
- Secure localStorage storage
- Token expiration tracking
- Refresh token support

✅ **API Security**
- Bearer token authentication
- HTTPS required
- Redirect URI validation

---

## 🐛 Troubleshooting

### **"Invalid state parameter" Error**
- **Cause:** Session state lost or tab closed during auth
- **Fix:** Retry authentication in same tab

### **401 Unauthorized**
- **Cause:** Token expired or invalid
- **Fix:** Re-authenticate with Qualtrics

### **"Client Secret not configured"**
- **Cause:** Credentials not saved
- **Fix:** Enter credentials and click "Save Credentials"

### **No Surveys Appear**
- **Cause:** Account has no surveys
- **Fix:** Create a survey in Qualtrics first

### **Questions Not Loading**
- **Cause:** API permissions missing
- **Fix:** Check OAuth app has `read:surveys` scope

---

## 📝 Example Usage

### **Manual Token Exchange**
```javascript
async function manualAuth(code) {
  const response = await fetch('https://sjc1.qualtrics.com/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: YOUR_CLIENT_ID,
      client_secret: YOUR_CLIENT_SECRET,
      redirect_uri: window.location.href
    })
  });
  
  const data = await response.json();
  const accessToken = data.access_token;
}
```

### **Fetch Surveys**
```javascript
async function getSurveys(token) {
  const response = await fetch('https://sjc1.qualtrics.com/API/v3/surveys', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.result.elements;
}
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────┐
│  survey.html (OAuth + API Client)           │
└─────────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   Qualtrics OAuth    │
        │  Authorization Page  │
        └──────────────────────┘
                    ↓
        ┌──────────────────────┐
        │ Generate Auth Code   │
        └──────────────────────┘
                    ↓
        ┌──────────────────────┐
        │  Exchange for Token  │
        └──────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   Store in Local     │
        │   Storage (Safe)     │
        └──────────────────────┘
                    ↓
        ┌──────────────────────┐
        │  Call Qualtrics API  │
        │  with Access Token   │
        └──────────────────────┘
                    ↓
        ┌──────────────────────┐
        │ Display Surveys +    │
        │ Questions to User    │
        └──────────────────────┘
```

---

## 🎯 Use Cases

1. **Research Data Collection**
   - Create surveys
   - Extract questions
   - Distribute via your site

2. **Survey Analytics**
   - Display survey list
   - Show question details
   - Track responses

3. **Integration Platform**
   - Embed surveys
   - Pre-fill responses
   - Custom workflows

4. **Educational Tool**
   - Student surveys
   - Feedback forms
   - Assessment tools

---

## 📋 Integration Checklist

- [x] OAuth setup complete
- [x] Client credentials configured
- [x] Redirect URI set correctly
- [x] Data center selected
- [x] Credentials saved
- [x] Authentication successful
- [x] Surveys loading
- [x] Questions displaying

---

## 🔗 Resources

- **Qualtrics OAuth Docs:** https://www.qualtrics.com/support/developers/
- **OAuth 2.0 Standard:** https://tools.ietf.org/html/rfc6749
- **Qualtrics API:** https://api.qualtrics.com/

---

## 📝 Notes

- Credentials stored in localStorage (browser)
- Clear browser data to logout
- Data center must match your account location
- Surveys must be in your account to appear
- Questions extracted in real-time from Qualtrics

---

**Status: ✅ Ready for Production**

The Qualtrics integration is fully functional and ready to use with your OAuth credentials!
