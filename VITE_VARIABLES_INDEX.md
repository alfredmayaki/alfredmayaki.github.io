# VITE Variables Documentation Index

## Your Question: "How are the API keys that are Vite ('VITE_BACKEND_URL') called in msc-survey.html?"

## Answer: Quick Reference

```javascript
// Called via ConfigManager method:
const backendUrl = configManager.getBackendUrl();

// Two locations in msc-survey.html:
// 1. Line 1102 - checkIfUserSubmitted()
// 2. Line 1269 - Form submission
```

---

## Documentation Files for VITE Variables

### For Different Needs

| Need | Read This | Time |
|------|-----------|------|
| **Super Quick Answer** | `VITE_VARIABLES_CHEAT_SHEET.md` | 2 min |
| **Visual Explanation** | `VITE_VARIABLES_VISUAL_GUIDE.md` | 5 min |
| **Complete Details** | `VITE_VARIABLES_COMPLETE_REFERENCE.md` | 10 min |
| **Deep Understanding** | `VITE_ENVIRONMENT_VARIABLES_EXPLAINED.md` | 15 min |

---

## Quick Navigation

### "Give me the answer now"
→ See: `VITE_VARIABLES_CHEAT_SHEET.md`

### "Show me with diagrams"
→ See: `VITE_VARIABLES_VISUAL_GUIDE.md`

### "I want all the details"
→ See: `VITE_VARIABLES_COMPLETE_REFERENCE.md`

### "Explain how it works"
→ See: `VITE_ENVIRONMENT_VARIABLES_EXPLAINED.md`

---

## File Comparison

| File | Focus | Contains |
|------|-------|----------|
| `VITE_VARIABLES_CHEAT_SHEET.md` | Quick facts | One-liners, tables |
| `VITE_VARIABLES_VISUAL_GUIDE.md` | Visual flow | Diagrams, arrows, examples |
| `VITE_VARIABLES_COMPLETE_REFERENCE.md` | Line-by-line | Exact code, line numbers |
| `VITE_ENVIRONMENT_VARIABLES_EXPLAINED.md` | Conceptual | How it works, why |

---

## The Basic Facts

```
Question: How are VITE variables called?
Answer: configManager.getBackendUrl()

Question: Where?
Answer: Lines 1102 and 1269

Question: What do they do?
Answer: Provide Cloud Functions endpoint URL

Question: What's called?
Answer: fetch(`${backendUrl}/submitSurvey`, ...)
```

---

## The Complete Flow

```
.env.local (VITE_BACKEND_URL=https://...)
           ↓
env-loader.js (reads and injects)
           ↓
window.__ENV__ (stores all variables)
           ↓
ConfigManager (provides access)
           ↓
configManager.getBackendUrl() (returns URL)
           ↓
msc-survey.html uses it in fetch()
```

---

## Code Locations

### Line 1102
```javascript
async function checkIfUserSubmitted(userId) {
  const backendUrl = configManager.getBackendUrl();  // ← HERE
  const response = await fetch(`${backendUrl}/checkSubmission`, {
    // ...
  });
}
```

### Line 1269
```javascript
// Inside form submit event listener
const backendUrl = configManager.getBackendUrl();  // ← HERE
const response = await fetch(`${backendUrl}/submitSurvey`, {
  // ...
});
```

---

## ConfigManager Methods

```javascript
// Main method used in msc-survey.html:
configManager.getBackendUrl()
// → Returns: "https://us-central1-..."

// Other methods available:
configManager.get('KEY')
configManager.getAll()
configManager.getFirebaseConfig()
```

---

## Testing in Browser

After page loads, type in console:

```javascript
// 1. Check if loaded
window.__ENV__
// Shows all VITE_* variables

// 2. Get backend URL
configManager.getBackendUrl()
// Returns: "https://us-central1-your-project.cloudfunctions.net"

// 3. Verify it works
const url = configManager.getBackendUrl()
console.log(url)
// Outputs the URL
```

---

## The Two Uses

### Use #1: Check If Already Submitted
- **Line:** 1102
- **Function:** `checkIfUserSubmitted()`
- **Endpoint:** `/checkSubmission`
- **Purpose:** Prevent duplicate submissions
- **Triggered:** When user authenticates

### Use #2: Submit Survey
- **Line:** 1269
- **Event:** Form submit
- **Endpoint:** `/submitSurvey`
- **Purpose:** Store survey responses
- **Triggered:** When user clicks submit

---

## Related Files in Your Repo

```
msc-survey.html          ← The main file (uses VITE variables)
env-loader.js            ← Loads .env.local
.env.local              ← Contains VITE_BACKEND_URL
.env.example            ← Template for team
CONFIGURATION_GUIDE.md  ← Setup instructions
```

---

## What Changed

Before (old code):
```javascript
// Hardcoded - BAD
const backendUrl = 'https://us-central1-supa-73a39.cloudfunctions.net';
```

After (new code):
```javascript
// Dynamic via ConfigManager - GOOD
const backendUrl = configManager.getBackendUrl();
```

**Benefits:**
- ✅ No hardcoded URLs in code
- ✅ Easy to change per environment
- ✅ Secure (credentials in .env.local, not in code)
- ✅ One change updates everywhere

---

## Common Questions

**Q: Why use ConfigManager instead of direct access?**
A: Validates config on startup, works with static HTML, provides clear errors

**Q: How does VITE naming work?**
A: It's just a convention. Variables are loaded via env-loader.js, not Vite build tool

**Q: Why two calls to getBackendUrl()?**
A: One checks submission, one submits. Both need the same URL

**Q: Can I change the URL?**
A: Yes! Just update VITE_BACKEND_URL in .env.local, reload browser

**Q: Does it work in production?**
A: Yes! Build tool injects env vars from platform (Vercel, Netlify, etc.)

---

## Documentation Structure

```
Original files you already have:
├── START_HERE.md (main entry point)
├── IMMEDIATE_ACTION.md (5-min setup)
├── QUICK_START.md (quick reference)
└── ... (8 other files)

NEW files about VITE variables:
├── VITE_VARIABLES_CHEAT_SHEET.md ← Start here
├── VITE_VARIABLES_VISUAL_GUIDE.md ← See diagrams
├── VITE_VARIABLES_COMPLETE_REFERENCE.md ← Full details
├── VITE_ENVIRONMENT_VARIABLES_EXPLAINED.md ← Deep dive
└── VITE_VARIABLES_INDEX.md (this file)
```

---

## Summary for Reference

```
┌──────────────────────────────────────────────┐
│ VITE Variables in msc-survey.html            │
├──────────────────────────────────────────────┤
│ Where:  Lines 1102 & 1269                   │
│ How:    configManager.getBackendUrl()       │
│ What:   Retrieves VITE_BACKEND_URL          │
│ Why:    Get Cloud Functions endpoint        │
│ Used:   fetch() API calls                   │
└──────────────────────────────────────────────┘
```

---

## Next Steps

1. **Quick answer?** → Read `VITE_VARIABLES_CHEAT_SHEET.md` (2 min)
2. **Want details?** → Read `VITE_VARIABLES_COMPLETE_REFERENCE.md` (10 min)
3. **See diagrams?** → Read `VITE_VARIABLES_VISUAL_GUIDE.md` (5 min)
4. **Deep understanding?** → Read `VITE_ENVIRONMENT_VARIABLES_EXPLAINED.md` (15 min)

---

**All questions about how VITE variables are called are answered in these 4 new documentation files!**
