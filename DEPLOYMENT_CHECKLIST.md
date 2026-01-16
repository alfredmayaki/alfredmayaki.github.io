# Firebase Deployment Checklist for MSC Survey

## Pre-Deployment ✅

- [ ] Firebase Blaze plan activated (billing enabled)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Firebase CLI installed (`firebase --version`)
- [ ] Authenticated with Firebase (`firebase login`)
- [ ] Git repository clean (`git status`)
- [ ] All files committed

## Deployment Steps

### 1. Install Dependencies
```bash
cd functions
npm install
cd ..
```
Expected: `npm WARN` messages are OK, no errors

### 2. Test Functions Locally (Optional)
```bash
firebase emulators:start --only functions
```
Expected: Emulator running on `http://localhost:5001`

### 3. Deploy Functions
```bash
firebase deploy --only functions
```

Expected Output:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/supa-73a39/overview
Function URL: https://us-central1-supa-73a39.cloudfunctions.net/submitSurvey
```

### 4. Verify Deployment
Test the health endpoint in your browser:
```
https://us-central1-supa-73a39.cloudfunctions.net/healthCheck
```

Should return JSON with status "healthy"

### 5. Test Full Survey Flow

1. Go to `https://alfredmayaki.me/msc-survey.html`
2. Sign in with Google
3. Fill out survey completely
4. Click "Submit Survey"
5. Should see ✅ success message

### 6. Check Logs
```bash
firebase functions:log
```

Should show:
```
✅ Survey saved successfully: <document-id>
```

## Post-Deployment ✅

- [ ] Functions deployed successfully
- [ ] Health check endpoint working
- [ ] Survey submission works end-to-end
- [ ] Logs show successful submissions
- [ ] Firestore has data stored
- [ ] `USE_LOCALSTORAGE_FALLBACK: false` in msc-survey.html

## Firestore Data Verification

### View Submitted Data
1. Firebase Console → Firestore Database
2. Select `surveySubmissions` collection
3. View documents with user responses

## Monitoring Setup

### Enable Notifications
```bash
# Set up Google Cloud alerts
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Firebase Functions Error Rate"
```

### Monitor Costs
1. Google Cloud Console → Billing
2. Set up budget alert at £50/month

## Rollback (If Needed)

### Revert to localStorage Fallback
Edit `msc-survey.html` line 639:
```javascript
USE_LOCALSTORAGE_FALLBACK: true
```

Deploy to GitHub:
```bash
git add msc-survey.html
git commit -m "Revert to localStorage fallback"
git push
```

## Costs

### Expected Monthly Costs
- **Cloud Functions**: ~£0.50 (invocations)
- **Firestore**: ~£1.00 (reads/writes/storage)
- **Hosting**: FREE (GitHub Pages)
- **Total**: ~£1.50/month for 100-200 survey submissions

### Cost Optimization
- Firestore auto-scales (perfect for research)
- Cloud Functions have generous free tier
- Blaze plan charges only for what you use

---

## Support Resources

- 📖 Firebase Docs: https://firebase.google.com/docs
- 🐛 Debugging: https://firebase.google.com/docs/functions/troubleshooting
- 💰 Pricing: https://firebase.google.com/pricing
- 🆘 Stack Overflow: `[firebase] [cloud-functions]`

---

**Status**: Ready for deployment ✅
