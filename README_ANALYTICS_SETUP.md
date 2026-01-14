# Cloudflare Analytics Dashboard - Setup Guide

## 📊 Overview

The `report.html` file provides a beautiful analytics dashboard that displays:
- Total Requests over 28 days
- Unique Visitors trends
- Bandwidth usage
- Cache hit rates
- Interactive line charts

## ⚠️ CORS Issue & Solutions

When you see **"Failed to fetch"** error, it's due to browser CORS (Cross-Origin Resource Sharing) restrictions. Cloudflare's API doesn't allow direct browser requests for security reasons.

---

## 🚀 Solution Options

### Option 1: View Demo Data (Easiest)
**Best for:** Testing the dashboard appearance without API setup

1. Open `report.html` in your browser
2. Click the **"View Demo Data"** button
3. See sample analytics charts and statistics

✅ No setup required  
✅ Works immediately  
❌ Shows fake data only

---

### Option 2: Cloudflare Worker Proxy (Recommended)
**Best for:** Production use with real data

#### Step-by-Step Setup:

1. **Deploy the Worker**
   ```
   - Go to: https://dash.cloudflare.com
   - Navigate to: Workers & Pages
   - Click: "Create Application" → "Create Worker"
   - Name it: analytics-proxy
   - Click: "Deploy"
   - Click: "Edit Code"
   - Copy ALL code from `cloudflare-worker-proxy.js`
   - Paste into the worker editor
   - Click: "Save and Deploy"
   - Copy your worker URL (e.g., https://analytics-proxy.yourname.workers.dev)
   ```

2. **Update report.html**
   
   Find this line (~line 715):
   ```javascript
   const restUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${since}&until=${until}&continuous=true`;
   ```
   
   Replace with:
   ```javascript
   const workerUrl = 'https://YOUR-WORKER-URL.workers.dev'; // 👈 Your worker URL here
   const restUrl = `${workerUrl}?since=${since}&until=${until}`;
   ```
   
   Then update the fetch headers (~line 725):
   ```javascript
   const response = await fetch(restUrl, {
     method: 'GET',
     headers: {
       'Authorization': `Bearer ${apiToken}`,
       'X-Zone-ID': zoneId,  // 👈 Add this line
       'Content-Type': 'application/json'
     }
   });
   ```

3. **Security (Production)**
   
   In your worker code, change:
   ```javascript
   const CORS_HEADERS = {
     'Access-Control-Allow-Origin': 'https://alfredmayaki.github.io', // 👈 Your domain
     ...
   };
   ```

4. **Test**
   - Open `report.html`
   - Enter your API credentials
   - Click "Fetch Analytics"
   - ✅ Data should load!

✅ Works with real data  
✅ No CORS issues  
✅ Cloudflare Free tier: 100,000 requests/day  
⚠️ Requires initial setup

---

### Option 3: Backend Server
**Best for:** Integration with existing backend

Create a simple proxy endpoint on your server:

**Node.js Example:**
```javascript
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://your-domain.com');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-Zone-ID');
  next();
});

app.get('/api/analytics', async (req, res) => {
  const { since, until } = req.query;
  const apiToken = req.headers.authorization;
  const zoneId = req.headers['x-zone-id'];

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${since}&until=${until}&continuous=true`,
    {
      headers: {
        'Authorization': apiToken,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  res.json(data);
});

app.listen(3000);
```

**Python/Flask Example:**
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, origins=['https://your-domain.com'])

@app.route('/api/analytics')
def get_analytics():
    since = request.args.get('since')
    until = request.args.get('until')
    api_token = request.headers.get('Authorization')
    zone_id = request.headers.get('X-Zone-ID')
    
    response = requests.get(
        f'https://api.cloudflare.com/client/v4/zones/{zone_id}/analytics/dashboard',
        params={'since': since, 'until': until, 'continuous': 'true'},
        headers={
            'Authorization': api_token,
            'Content-Type': 'application/json'
        }
    )
    
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(port=3000)
```

Then update `report.html` to use your backend URL.

✅ Full control  
✅ Can add authentication  
⚠️ Requires server hosting  
⚠️ More complex setup

---

### Option 4: Browser Extension (Development Only)
**Best for:** Quick local testing

1. Install a CORS extension:
   - Chrome: [Allow CORS](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf)
   - Firefox: [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)

2. Enable the extension
3. Open `report.html`
4. Fetch analytics

❌ **NOT for production**  
❌ Security risk  
✅ Fast for testing

---

## 🔑 Getting Cloudflare API Credentials

### API Token
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click: **Create Token**
3. Use template: **Analytics** (or create custom)
4. Permissions: `Zone → Analytics → Read`
5. Zone Resources: Include → Specific zone → [Your domain]
6. Click: **Continue to summary** → **Create Token**
7. **Copy the token** (shown only once!)

### Zone ID
1. Go to: https://dash.cloudflare.com
2. Select your domain
3. Scroll down on **Overview** page
4. Right sidebar → **API** section → **Zone ID**
5. Click to copy

### Account ID (Optional)
1. Go to: https://dash.cloudflare.com
2. Workers & Pages (left menu)
3. **Account ID** shown on right

---

## 📁 Project Files

```
├── report.html                        # Main analytics dashboard
├── cloudflare-worker-proxy.js         # Cloudflare Worker proxy code
├── WORKER_SETUP_INSTRUCTIONS.js       # Detailed worker setup guide
├── README_ANALYTICS_SETUP.md          # This file
└── standardize_back_button.py         # Script for index files (separate task)
```

---

## 🐛 Troubleshooting

### "Failed to fetch" Error
- **Cause:** CORS blocking direct API calls
- **Fix:** Use Cloudflare Worker (Option 2) or Demo Data (Option 1)

### "Authentication failed (401)"
- **Cause:** Invalid or expired API token
- **Fix:** Generate new token with `Analytics:Read` permission

### "Zone not found (404)"
- **Cause:** Incorrect Zone ID
- **Fix:** Copy Zone ID from Cloudflare dashboard

### "Access denied (403)"
- **Cause:** API token lacks permissions
- **Fix:** Ensure token has `Zone → Analytics → Read` permission

### Charts not displaying
- **Cause:** No data for selected date range
- **Fix:** Try different dates or check browser console (F12)

### Worker deployment fails
- **Cause:** Syntax error in worker code
- **Fix:** Copy code exactly from `cloudflare-worker-proxy.js`

---

## 💡 Tips

1. **Save Credentials:** Click "Save Credentials" to store them locally (only in your browser)

2. **Date Range:** Default is 28 days, but you can customize

3. **Demo Mode:** Use "View Demo Data" to see how charts work before API setup

4. **Worker Free Tier:** Cloudflare Workers Free plan = 100,000 requests/day (more than enough!)

5. **Console Logging:** Open browser console (F12) to see detailed API responses

6. **Security:** Never commit API tokens to Git! Use environment variables or localStorage only.

---

## 🎯 Quick Start (TL;DR)

**Fastest way to see it working:**
```
1. Open report.html
2. Click "View Demo Data"
3. Done! ✨
```

**To use real data:**
```
1. Deploy cloudflare-worker-proxy.js to Cloudflare Workers
2. Update report.html with worker URL (2 lines)
3. Get API Token + Zone ID from Cloudflare
4. Enter credentials and fetch analytics
5. Done! 🎉
```

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify API credentials are correct
3. Test worker deployment separately
4. Review WORKER_SETUP_INSTRUCTIONS.js for examples

---

## 📜 License

© 2026 Alfred A. B. Mayaki. All rights reserved.

---

**Need help?** Check the browser console for detailed error messages!
