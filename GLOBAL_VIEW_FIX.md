# 🌍 Global View Troubleshooting Guide

## ❓ **Why Isn't "Everyone's Searches" Updating?**

The global view now uses **Cloudflare Worker API** instead of Firebase. Here's how to get it working:

---

## 🔍 **Quick Diagnosis**

### **Test 1: Check Worker Status**

Open browser console and run:

```javascript
// Test if worker is reachable
fetch('https://search-tracker.alfred-mayaki.workers.dev/api/search/global')
  .then(r => r.json())
  .then(d => console.log('✅ Worker response:', d))
  .catch(e => console.error('❌ Worker error:', e));
```

**Expected Results:**

✅ **Working:**
```json
{
  "keywords": {...},
  "totalSearches": 5,
  "uniqueWords": 3
}
```

❌ **Not Deployed:**
```
TypeError: Failed to fetch
```

---

## 🛠️ **Solution Steps**

### **Scenario A: Worker Not Deployed**

**Symptoms:**
- "Unable to Load Global Data" error
- Console shows: `Failed to fetch`
- 404 error in network tab

**Fix:**
```sh
# Deploy the worker
wrangler deploy

# Wait for deployment (30 seconds)
# Then refresh tagcloud.html
```

---

### **Scenario B: Wrong API URL**

**Symptoms:**
- 404 error
- Worker deployed but not accessible

**Fix:**

1. **Check actual worker URL:**
   ```sh
   wrangler deployments list
   ```

2. **Update search-tracker-api.js:**
   ```javascript
   // Line 13 - Update with YOUR actual URL
   const API_BASE_URL = 'https://YOUR-ACTUAL-URL.workers.dev/api/search';
   ```

3. **Commit and push:**
   ```sh
   git add search-tracker-api.js
   git commit -m "Update worker URL"
   git push origin main
   ```

---

### **Scenario C: No Global Data Yet**

**Symptoms:**
- Worker responds with empty data
- Shows "No global data available yet"

**Fix:**

This is normal! Global data accumulates over time.

**Seed some data:**

1. Open `test-recent-searches.html`
2. Click "Add 3 Test Searches"
3. Wait 10 seconds for sync
4. Click "🌍 Everyone's Searches"

---

## 🧪 **Testing Global View**

### **Test 1: Local Testing**

```javascript
// In browser console on tagcloud.html
SearchTrackerAPI.getGlobalCloud().then(result => {
  console.log('Global data:', result);
});

// Expected:
// {
//   success: true,
//   source: 'api',
//   data: {
//     keywords: {...},
//     totalSearches: 5,
//     uniqueWords: 3
//   }
// }
```

### **Test 2: Multi-User Simulation**

1. **User 1:**
   - Open test-recent-searches.html
   - Add searches: "cloudflare", "worker", "testing"

2. **User 2 (different browser/incognito):**
   - Open test-recent-searches.html
   - Add searches: "deployment", "global", "tracking"

3. **View Global:**
   - Click "🌍 Everyone's Searches"
   - Should see both users' keywords combined!

---

## 📊 **How Global Aggregation Works**

### **Data Flow:**

```
User A                    Cloudflare Worker               User B
  ↓                              ↓                           ↓
Search "test"              Track & Store                Search "demo"
  ↓                              ↓                           ↓
POST /track           → KV: global:test = 1         ← POST /track
                           KV: global:demo = 1
                                  ↓
                          GET /global returns:
                          {
                            test: 1,
                            demo: 1
                          }
                                  ↓
                          🌍 Global Tag Cloud
                          Shows: test (1), demo (1)
```

### **Storage Keys:**

```
Personal searches:
- search:userId1:timestamp1 → {query: "test", ...}
- search:userId2:timestamp2 → {query: "demo", ...}

Aggregated keywords:
- global:keyword:test → "1"
- global:keyword:demo → "1"

Total count:
- global:totalSearches → "2"
```

---

## 💡 **Current Behavior**

### **Personal View (🔒 My Searches)**
- Uses: localStorage (instant) + Cloudflare API (sync)
- Shows: Only your searches
- Works: Offline via localStorage
- Updates: Real-time (3 seconds)

### **Global View (🌍 Everyone's Searches)**
- Uses: Cloudflare API only
- Shows: All users' searches combined
- Works: Only when worker is deployed
- Updates: On page refresh or manual refresh

---

## 🚀 **Deployment Checklist**

Before global view will work:

- [ ] Cloudflare Worker deployed (`wrangler deploy`)
- [ ] API URL updated in search-tracker-api.js
- [ ] Changes committed to GitHub
- [ ] GitHub Pages rebuilt (1-2 minutes)
- [ ] At least one search tracked (for test data)

---

## 🔧 **Advanced Debugging**

### **Check KV Storage:**

```sh
# List all global keys
wrangler kv:key list --binding=SEARCH_DATA --prefix="global:"

# Check specific keyword count
wrangler kv:key get "global:keyword:test" --binding=SEARCH_DATA

# Check total searches
wrangler kv:key get "global:totalSearches" --binding=SEARCH_DATA
```

### **View Worker Logs:**

```sh
# Real-time logs
wrangler tail

# Then perform a search and watch the logs
```

### **Test API Directly:**

```sh
# Test global endpoint
curl https://YOUR-WORKER-URL.workers.dev/api/search/global

# Test tracking (adds data)
curl -X POST https://YOUR-WORKER-URL.workers.dev/api/search/track \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","query":"test query","keywords":["test","query"]}'
```

---

## ✅ **Success Indicators**

When everything works:

1. **Console shows:**
   ```
   🌍 Loading global cloud from Cloudflare Worker API...
   🔄 Calling SearchTrackerAPI.getGlobalCloud()...
   📦 Global API Result: {success: true, source: 'api'}
   ✅ Global data loaded: 5 total searches
   ```

2. **Page displays:**
   - Tag cloud with aggregated keywords
   - Stats showing total searches from all users
   - Recent searches (if any)

3. **Network tab shows:**
   - `GET /api/search/global` → 200 OK

---

## 📞 **Still Not Working?**

### **Common Issues:**

1. **CORS errors:** Check worker includes CORS headers (already in code)
2. **401 Unauthorized:** Run `wrangler login` again
3. **500 errors:** Check worker logs with `wrangler tail`
4. **Empty data:** Normal if no searches yet - add test data

### **Get Help:**

1. Check browser console for detailed error messages
2. Run `wrangler deployments list` to verify deployment
3. Check network tab for actual API responses
4. Review worker logs with `wrangler tail`

---

## 🎯 **Expected Timeline**

| Action | Time | Status |
|--------|------|--------|
| Deploy worker | 30 sec | Worker live |
| First search | Instant | Data in KV |
| View global | Instant | Shows data |
| More searches | Real-time | Updates on refresh |

---

**Ready to enable global view?** Run `wrangler deploy` and test! 🌍
