# 📊 MSC Survey - Quick Reference

## What Was Created

✅ **msc-survey.html** (680+ lines)
- Secure survey web app
- Google OAuth 2.0 authentication required
- Responsive design matching your site theme
- 7 questions from Miller & Doyle (2025)

✅ **firebase-functions/index.js** (Backend)
- Verify OAuth tokens
- Check duplicate submissions
- Write to Google Sheets
- Track responses in Firestore

✅ **MSC_SURVEY_SETUP.md** (Complete guide)
- Step-by-step configuration
- Security best practices
- Troubleshooting tips

✅ **.env.example** (Configuration template)
- Environment variables template
- Security notes
- How to obtain credentials

✅ **index.html** (Updated)
- Added "📊 Neurodiversity Survey" to navigation

---

## Key Features

| Feature | Details |
|---------|---------|
| **Authentication** | Google OAuth 2.0 (requires login) |
| **Duplicate Prevention** | One submission per Google account |
| **Data Storage** | Google Sheets + Firestore |
| **Questions** | 7 questions + sub-questions |
| **Design** | Matches your site theme (dark mode) |
| **Mobile** | Fully responsive |
| **Security** | HTTPS, encrypted, no sensitive data in frontend |

---

## Quick Start (5 Minutes)

### 1. Copy Survey File
```bash
msc-survey.html is ready to use
```

### 2. Update Navigation
```bash
# Already done in index.html ✅
# Added: "📊 Neurodiversity Survey" → msc-survey.html
```

### 3. Deploy
```bash
git add msc-survey.html index.html .env.example MSC_SURVEY_SETUP.md
git commit -m "Add secure MSc survey with Google OAuth 2.0"
git push origin main
```

### 4. Configure (First Time Only)
Follow **MSC_SURVEY_SETUP.md** for:
- Google Cloud setup (5 min)
- Firebase setup (5 min)
- Environment configuration (2 min)

---

## Survey Questions (Miller & Doyle, 2025)

```
1. What attracts you to an organization?
   
2. How do you perceive if a potential employer is inclusive?
   a. How does this impact you?
   
3. What was your experience of your current organization?
   a. Other experiences that were same/different?
   
4. Do you disclose your neurodivergence?
   a. Experience of disclosing/deciding not to?
   
5. What's your experience of adjustments?
   
6. When at your best during recruitment, that's like what?
   a. How did the organization help?
   
7. Anything else you want to share?
```

---

## Form Design

| Question | Type | Size | Required |
|----------|------|------|----------|
| Q1 | Textarea | Medium (120px) | Yes |
| Q2 | Textarea | Medium (120px) | Yes |
| Q2a | Textarea | Small (80px) | No |
| Q3 | Textarea | Medium (120px) | Yes |
| Q3a | Textarea | Small (80px) | No |
| Q4 | Textarea | Medium (120px) | Yes |
| Q4a | Textarea | Large (160px) | No |
| Q5 | Textarea | Large (160px) | Yes |
| Q6 | Textarea | Medium (120px) | Yes |
| Q6a | Textarea | Small (80px) | No |
| Q7 | Textarea | Medium (120px) | No |

---

## User Flow

```
┌─────────────────────────┐
│ Visit msc-survey.html   │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ See login page          │
│ Click "Sign in with     │
│  Google" button         │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Google popup opens      │
│ User enters credentials │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Check if already        │
│ submitted (Firestore)   │
└────────────┬────────────┘
             ↓
      ┌──────┴──────┐
      ↓             ↓
┌──────────┐  ┌──────────────┐
│Submitted │  │Not submitted │
│ already? │  │  - Show form │
└──────────┘  └──────┬───────┘
             ↓
┌─────────────────────────┐
│ User fills 7 questions  │
│ Progress bar shows      │
│ completion              │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Click "Submit Survey"   │
│ Loading state shown     │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Backend receives data   │
│ - Verify token         │
│ - Check duplicates     │
│ - Append to Sheets     │
│ - Log in Firestore     │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Success page shown      │
│ Timestamp displayed     │
│ Link to homepage        │
└─────────────────────────┘
```

---

## Security Implementation

✅ **Authentication**
- Google OAuth 2.0 required
- Token verification on backend
- No passwords stored

✅ **Duplicate Prevention**
- Firestore tracks submitted users
- Server-side validation
- Can't submit twice from same account

✅ **Data Protection**
- HTTPS only
- API keys never exposed to frontend
- Backend handles all sensitive operations

✅ **Privacy**
- User ID tracked (not IP)
- No marketing cookies
- Google Analytics optional

---

## File Structure

```
repository/
├── msc-survey.html              ← Survey app
├── index.html                   ← Updated with nav link
├── .env.example                 ← Configuration template
├── .env                         ← YOUR secrets (in .gitignore)
├── MSC_SURVEY_SETUP.md          ← Full setup guide
├── firebase-functions/
│   └── index.js                 ← Backend functions
└── README.md                    ← Project description
```

---

## Environment Variables

You'll need these (in `.env`):

```
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_API_KEY=your_api_key
GOOGLE_SHEET_ID=your_sheet_id
BACKEND_URL=https://your-firebase-project.cloudfunctions.net
NODE_ENV=production
```

⚠️ **NEVER commit .env file!** Add to .gitignore

---

## Testing Checklist

- [ ] Can login with Google account
- [ ] Survey form displays all 7 questions
- [ ] Can type in textareas
- [ ] Progress bar updates as you fill form
- [ ] All 5 required questions enforced
- [ ] Can submit survey
- [ ] Success page shows after submission
- [ ] Second submission blocked ("already submitted")
- [ ] Data appears in Google Sheet
- [ ] Can logout (redirects to homepage)
- [ ] Mobile responsive (test on phone)
- [ ] No console errors (F12)

---

## Customization Options

### Change Survey Questions
Edit `msc-survey.html` around line 390:

```html
<div class="question-group">
  <div class="question-number">1</div>
  <label class="question-label">
    Your new question here
  </label>
  <textarea name="q1" class="textarea-md" required></textarea>
</div>
```

### Change Colors
Edit CSS variables in `msc-survey.html`:

```css
:root {
  --brand: #3d4ee9;        /* Blue */
  --green: #10b981;        /* Success */
  --red: #ef4444;          /* Error */
}
```

### Change Textarea Size
```html
<!-- Small -->
<textarea class="textarea-sm"></textarea>

<!-- Medium -->
<textarea class="textarea-md"></textarea>

<!-- Large -->
<textarea class="textarea-lg"></textarea>
```

### Change Redirect URL
Edit `logout-btn` onclick in `msc-survey.html`:

```javascript
window.location.href = 'https://your-url.com/';
```

---

## Monitoring & Analytics

### See Submissions
Google Sheets → View responses in real-time

### Check Errors
Firebase Console → Cloud Logging → Function Logs

### Monitor Quota
Google Cloud Console → Quotas & System Limits

### Track Users
Firebase Console → Firestore → survey_submissions collection

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Login button not showing | Check `GOOGLE_CLIENT_ID` in .env |
| Can't submit survey | Verify backend URL and Cloud Functions deployed |
| Data not in Sheets | Confirm service account has edit access |
| "Already submitted" error | This is correct behavior - prevents duplicates |
| CORS error | Add `https://alfredmayaki.me` to Cloud Functions CORS |

---

## References

- **Survey Source:** Miller, H., & Doyle, N. (2025). Signalling a diversity climate: Neurodivergent experiences and perceptions during selection and assessment. *Journal of Occupational and Organizational Psychology*, 98(3).

- **OAuth Documentation:** https://developers.google.com/identity/gsi

- **Google Sheets API:** https://developers.google.com/sheets/api

- **Firebase:** https://firebase.google.com/docs

---

## Deployment Status

| Component | Status | Details |
|-----------|--------|---------|
| Frontend (HTML) | ✅ Ready | msc-survey.html created |
| Navigation | ✅ Ready | Added to index.html |
| Backend (Functions) | 📋 Template | firebase-functions/index.js provided |
| Configuration | 📋 Template | .env.example provided |
| Documentation | ✅ Complete | MSC_SURVEY_SETUP.md included |

---

## Next Steps

1. **Read** MSC_SURVEY_SETUP.md (complete guide)
2. **Get** Google Cloud & Firebase credentials
3. **Configure** environment variables in .env
4. **Deploy** Firebase Cloud Functions
5. **Test** survey locally first
6. **Push** to GitHub
7. **Monitor** responses in Google Sheets

---

## Support

- **Setup Help:** See MSC_SURVEY_SETUP.md
- **Code Issues:** Check browser console (F12) for errors
- **Google Issues:** Check Google Cloud Console
- **Firebase Issues:** Check Firebase Console

---

**Everything is ready to deploy! Follow the setup guide to get started.** 🚀

Time to complete setup: **~30 minutes**
Time to understand code: **~10 minutes**
