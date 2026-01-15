# 🚀 Quick Start Guide

## Current File Structure

✅ **Worker files are now in root:**
- `wrangler.toml` - Worker configuration
- `search-tracker.js` - Worker code (API)
- `search-tracker-api.js` - Frontend client

## Next Steps

### 1️⃣ Install Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 2️⃣ Create KV Namespace
```bash
wrangler kv:namespace create "SEARCH_DATA"
# Copy the ID from output
```

### 3️⃣ Update wrangler.toml
```toml
kv_namespaces = [
  { binding = "SEARCH_DATA", id = "PASTE_YOUR_KV_ID_HERE" }
]
```

### 4️⃣ Deploy
```bash
wrangler deploy
```

### 5️⃣ Test
```bash
# Test the API
curl https://alfredmayaki.me/api/search/track \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","query":"hello world","keywords":["hello","world"]}'
```

## Files Status

### ✅ Ready to Deploy
- [x] `search-tracker.js` - Worker code
- [x] `wrangler.toml` - Configuration (needs KV ID)
- [x] `search-tracker-api.js` - Frontend client

### 📝 Needs Updates (After Deployment)
- [ ] `index.html` - Add API client script
- [ ] `tagcloud.html` - Update to use API

### 📋 Manual Steps Required
1. Run `wrangler kv:namespace create "SEARCH_DATA"`
2. Copy the KV namespace ID
3. Paste ID into `wrangler.toml`
4. Run `wrangler deploy`
5. Add `<script src="search-tracker-api.js"></script>` to HTML files

## Documentation

- 📖 **Full Guide**: `CLOUDFLARE_DEPLOYMENT.md`
- 🔧 **Worker Code**: `search-tracker.js`
- 💻 **API Client**: `search-tracker-api.js`

## Commands Reference

```bash
# Login
wrangler login

# Create KV
wrangler kv:namespace create "SEARCH_DATA"

# Deploy
wrangler deploy

# View logs
wrangler tail

# List KV keys
wrangler kv:key list --binding=SEARCH_DATA
```

## Ready? 

Follow **CLOUDFLARE_DEPLOYMENT.md** for detailed instructions! 🎯
