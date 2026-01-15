# 🔐 Security Setup Guide for Cloudflare Worker

## ❓ **Why Do You Need Security?**

Without authentication, your worker is **publicly accessible**, meaning:

- ❌ Anyone can write fake data to your KV store
- ❌ Malicious users could exhaust your free tier limits (1,000 writes/day)
- ❌ Your data could be polluted with spam
- ❌ No control over who accesses your analytics

---

## 🛡️ **What Was Added:**

### **1. API Key Authentication**
- Write operations (POST, DELETE) now require an API key
- Read operations (GET) remain public (for now)
- Key is stored securely in Cloudflare Secrets

### **2. Domain Restriction**
- CORS now only allows requests from `alfredmayaki.me`
- Prevents other websites from using your API

### **3. Request Header Validation**
- API key must be sent in `X-API-Key` header
- Invalid/missing keys return 401 Unauthorized

---

## 🚀 **Setup Instructions:**

### **Step 1: Generate a Strong API Key**

```sh
# Generate a random 32-byte key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# a3f7b2c9d8e1f4a6b5c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9
```

**Copy this key!** You'll need it in the next steps.

---

### **Step 2: Store Secret in Cloudflare**

```sh
# Set the API secret
wrangler secret put API_SECRET

# When prompted, paste your generated key:
# Enter a secret value: [paste key here]

# You should see:
# ✨ Success! Uploaded secret API_SECRET
```

**⚠️ IMPORTANT:** This secret is stored securely in Cloudflare and **never** appears in your code or Git repository!

---

### **Step 3: Update Frontend API Client**

Edit `search-tracker-api.js`:

```javascript
// Line 13 - Add your API key
const API_KEY = 'a3f7b2c9d8e1f4a6b5c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9';
```

**⚠️ WARNING:** This makes your key visible in frontend code!

**Better approach:** Use environment variables or server-side proxy (see advanced options below).

---

### **Step 4: Deploy Worker**

```sh
wrangler deploy

# Should see:
# ✨ Success! Uploaded search-tracker
#   https://search-tracker.YOUR-SUBDOMAIN.workers.dev
```

---

### **Step 5: Test Authentication**

#### **Test 1: Without API Key (Should Fail)**

```sh
curl -X POST https://search-tracker.YOUR-SUBDOMAIN.workers.dev/api/search/track \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","query":"test","keywords":["test"]}'

# Expected:
# {"error":"Unauthorized - Invalid or missing API key"}
# Status: 401
```

#### **Test 2: With API Key (Should Succeed)**

```sh
curl -X POST https://search-tracker.YOUR-SUBDOMAIN.workers.dev/api/search/track \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_ACTUAL_KEY_HERE" \
  -d '{"userId":"test","query":"test","keywords":["test"]}'

# Expected:
# {"success":true,"searchId":"...","timestamp":...}
# Status: 200
```

---

## 🎯 **What's Protected Now:**

| Endpoint | Method | Protected? | Reason |
|----------|--------|-----------|---------|
| `/api/search/track` | POST | ✅ Yes | Writes data - needs auth |
| `/api/search/clear` | DELETE | ✅ Yes | Deletes data - needs auth |
| `/api/search/cloud` | GET | ❌ No | Read-only - public |
| `/api/search/global` | GET | ❌ No | Read-only - public |

---

## ⚠️ **Current Limitation:**

The API key is **visible in your frontend JavaScript**. This means:

- ✅ Prevents random strangers from spamming your API
- ❌ Anyone who views your source code can see the key
- ❌ Not suitable for truly sensitive data

---

## 🔒 **Advanced Security Options:**

### **Option A: Use Cloudflare Access (Recommended)** ⭐

```toml
# wrangler.toml
[access]
policy_id = "YOUR_CLOUDFLARE_ACCESS_POLICY_ID"
```

**Pros:**
- Enterprise-grade authentication
- OAuth/SSO support
- No exposed keys
- Free for personal projects

**Setup:**
1. Go to Cloudflare Dashboard → Zero Trust → Access
2. Create an Access Policy
3. Add policy ID to wrangler.toml

### **Option B: Server-Side Proxy**

Instead of calling worker directly from browser:

```
Browser → Your Server → Cloudflare Worker
         (with API key)
```

**Pros:**
- API key hidden from users
- Can add custom rate limiting
- Full control

**Cons:**
- Requires backend server
- More complex setup

### **Option C: Cloudflare Turnstile (CAPTCHA Alternative)**

Add Turnstile to your frontend:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
```

Then validate the token in your worker:

```javascript
// Verify Turnstile token
const formData = new FormData();
formData.append('secret', env.TURNSTILE_SECRET);
formData.append('response', token);

const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  body: formData
});
```

**Pros:**
- Free
- Better UX than CAPTCHA
- Bot protection

---

## 📊 **Rate Limiting (Additional Protection)**

Add rate limiting to prevent abuse:

```javascript
// In search-tracker.js
async function checkRateLimit(userId, env) {
  const key = `ratelimit:${userId}`;
  const count = parseInt(await env.SEARCH_DATA.get(key) || '0');
  
  // Limit: 100 requests per hour
  if (count > 100) {
    return false;
  }
  
  // Increment counter
  await env.SEARCH_DATA.put(key, (count + 1).toString(), {
    expirationTtl: 3600 // 1 hour
  });
  
  return true;
}

// In handleTrackSearch
if (!await checkRateLimit(userId, env)) {
  return jsonResponse({ 
    error: 'Rate limit exceeded. Try again later.' 
  }, 429, corsHeaders);
}
```

---

## 🎓 **Best Practices:**

### **✅ DO:**
- Use strong, random API keys (32+ bytes)
- Store secrets using `wrangler secret put`
- Restrict CORS to your domain only
- Add rate limiting
- Monitor worker logs (`wrangler tail`)
- Rotate keys periodically

### **❌ DON'T:**
- Commit secrets to Git
- Use simple/guessable keys
- Allow `Access-Control-Allow-Origin: *` in production
- Trust client-side validation only
- Ignore unusual traffic patterns

---

## 🔍 **Monitoring Security:**

### **Check for Abuse:**

```sh
# View real-time logs
wrangler tail

# Look for:
# - 401 errors (failed auth attempts)
# - Unusual traffic patterns
# - High request rates from single users
```

### **Cloudflare Analytics:**

Visit: https://dash.cloudflare.com → Workers → search-tracker

Monitor:
- Request volume
- Error rates
- Response times
- Geographic distribution

---

## 🚨 **If Your Key Is Compromised:**

1. **Generate new key:**
   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update Cloudflare:**
   ```sh
   wrangler secret put API_SECRET
   # Enter new key
   ```

3. **Update frontend:**
   ```javascript
   const API_KEY = 'NEW_KEY_HERE';
   ```

4. **Deploy changes:**
   ```sh
   wrangler deploy
   git add search-tracker-api.js
   git commit -m "Rotate API key"
   git push
   ```

5. **Monitor for old key usage:**
   ```sh
   wrangler tail
   # Look for 401 errors
   ```

---

## 📝 **Summary:**

### **Current Setup:**

| Feature | Status | Security Level |
|---------|--------|---------------|
| API Key Auth | ✅ Enabled | Medium |
| CORS Restriction | ✅ Enabled | Good |
| Rate Limiting | ❌ Not Yet | - |
| Secret Management | ✅ Cloudflare | Excellent |
| Frontend Exposure | ⚠️ Yes | Low |

### **Recommended Next Steps:**

1. ✅ **Immediate:** Use the API key setup (done above)
2. ⭐ **Better:** Implement Cloudflare Access
3. 🚀 **Best:** Server-side proxy + Turnstile

---

## 💡 **For Your Use Case:**

Since this is a **personal research project**, the current API key setup should be sufficient. It prevents:

- ✅ Random people from spamming your API
- ✅ Bots from polluting your data
- ✅ Accidental free tier exhaustion

But remember:
- ⚠️ Anyone determined enough can extract your key from frontend code
- ⚠️ For production/commercial use, implement Cloudflare Access or server-side proxy

---

**Ready to secure your worker?** Follow the steps above! 🔐
