# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website (alfredmayaki.github.io) with an integrated AI chatbot powered by Claude Opus 4.6. The site features multilingual support (15 languages) and includes professional profile information, research work, and an interactive AI assistant.

**Tech Stack:**
- Frontend: HTML5, CSS3, JavaScript (ES5), particles.js
- Backend: Node.js/Express (server.js), Cloudflare Workers (worker/src/index.js)
- AI Integration: Anthropic Claude API via Cloudflare Workers proxy
- Database: Firebase Admin SDK, IndexedDB for client-side chat persistence
- File Processing: multer, pdf-parse, mammoth for document uploads
- Deployment: GitHub Pages (static), Cloudflare Workers (API), Heroku (optional Node backend)

## Architecture

### Three-Tier Architecture

1. **Static Frontend (GitHub Pages)**
   - Main site: `index.html` with language variants (`index_en.html`, `index_fr.html`, etc.)
   - Content pages: `about.html`, `research.html`, `projects.html`, `contact.html`, `ai.html`
   - Client-side JavaScript: `index.js` (chatbot UI and logic)
   - CSS: Inline in HTML files with custom dark theme and JavaScript/code-inspired color palette

2. **Cloudflare Worker Proxy (`worker/src/index.js`)**
   - Deployed at `alfredmayaki.me/chat`
   - Routes chat requests to Anthropic Claude API
   - Handles document uploads and text extraction (PDF, DOCX, TXT, CSV)
   - TTS endpoint at `/tts` using Cloudflare AI binding (Deepgram Aura-2)
   - Configured via `worker/wrangler.toml`

3. **Optional Node.js Backend (`server.js`)**
   - Provides `/api/claude`, `/api/gpt`, `/api/upload` endpoints
   - Firebase session management
   - Can be deployed to Heroku or used for local development
   - Note: Production traffic uses Cloudflare Workers, not this server

### Chat Flow Architecture

**Client → Worker → Claude API:**
```
index.js (processQuery)
  → POST alfredmayaki.me/chat
    → worker/src/index.js (callAnthropicAPI)
      → api.anthropic.com/v1/messages
        → Response back through chain
```

**Conversation History:**
- Stored in-memory in `state.conversationHistory` (index.js:244)
- Persisted to IndexedDB via ChatDB helper (expected in external script)
- Limited to `CONFIG.maxHistoryTurns * 2` messages (index.js:567-570)
- History sent with each request to maintain context

**File Upload Flow:**
1. User selects file via `#docUploadInput` or chatbot's file upload UI
2. File stored in `state.uploadedFile` (index.js:246)
3. On send, FormData with message + file posted to `/chat`
4. Worker extracts text based on file type (worker/src/index.js:77-106)
5. Extracted text injected as document context to Claude prompt

## Common Development Commands

### Cloudflare Workers Development & Deployment

```bash
# Navigate to worker directory
cd worker

# Install dependencies
npm install

# Run local development server (port 8787)
npm run dev
# or
npx wrangler dev

# Deploy to Cloudflare
npm run deploy
# or
npx wrangler deploy

# View live logs
npx wrangler tail

# Check worker configuration
npx wrangler whoami
```

### Node.js Backend (Optional)

```bash
# Install dependencies
npm install

# Start local server (default port 3000)
npm start
# or
node server.js

# Check environment configuration
curl http://localhost:3000/debug/env

# Health check
curl http://localhost:3000/health
```

### Testing Locally

To test the full stack locally:

1. Start Cloudflare Worker dev server: `cd worker && npx wrangler dev`
2. Update `index.js` CONFIG.chatApiUrl to point to local worker (default: `http://localhost:8787/chat`)
3. Serve static files: Use any local server (e.g., `python -m http.server 8000` or VS Code Live Server)
4. Open `http://localhost:8000` in browser

### Environment Variables

**Cloudflare Worker** (set via `wrangler secret put`):
- `ANTHROPIC_API_KEY` - Required for Claude API access
- `AI_MODEL` - Model name (default: "claude-opus-4-6")
- `AI_PROVIDER` - Provider name (default: "anthropic")

**Node.js Server** (set via `.env` or environment):
- `OPENAI_API_KEY` - For GPT proxy endpoint
- `CLAUDE_API_KEY` - For Claude proxy endpoint
- `CLAUDE_API_URL` - Claude API endpoint URL
- `PORT` - Server port (default: 3000)

**Setting Worker Secrets:**
```bash
cd worker
npx wrangler secret put ANTHROPIC_API_KEY
# Paste API key when prompted
```

## Key File Locations

### Core Application Files
- `index.html` - Main landing page with language selector and phone-style UI
- `index.js` - Chatbot frontend logic (1228 lines, handles UI, API calls, history)
- `worker/src/index.js` - Cloudflare Worker API handler (349 lines)
- `worker/wrangler.toml` - Worker deployment configuration
- `server.js` - Optional Express backend (375 lines)

### Language Variants
All follow same structure as `index.html` but with translated content:
- English: `index_en.html`
- French: `index_fr.html`
- German: `index_de.html`
- Spanish: `index_es.html`
- Italian: `index_it.html`
- Portuguese: `index_pt.html`
- Dutch: `index_nl.html`
- Russian: `index_ru.html`
- Turkish: `index_tr.html`
- Arabic: `index_ksa.html`
- Hebrew: `index_he.html`
- Chinese: `index_ch.html`
- Japanese: `index_jp.html`
- Welsh: `index_cy.html`
- Swahili: `index_sw.html`
- Yoruba: `index_yb.html`

### Content Pages
- `ai.html` - Dedicated AI chatbot page with full-screen interface
- `about.html` - About/bio page
- `research.html` - Research work and publications
- `projects.html` - Project portfolio
- `contact.html` - Contact information with social links
- `references.html` - Professional references
- `buymeacoffee.html` - Support/donation page
- `milano-cortina-day-2.html` - Event coverage page
- Other specialty pages: `claude-code.html`, `claude-opus-4-6.html`, `winter-olympics.html`, etc.

### Configuration Files
- `package.json` - Node.js dependencies
- `worker/package.json` - Worker-specific dependencies (@anthropic-ai/sdk)
- `firebase.json` - Firebase configuration (minimal remote config setup)
- `.firebaserc` - Firebase project reference
- `serviceAccountKey.json` - Firebase Admin credentials (not in repo, required for Firebase features)
- `.github/copilot-instructions.md` - GitHub Copilot configuration with UI/UX preferences

## Important Implementation Details

### Chatbot State Management (index.js)

The chatbot maintains state in a central `state` object (lines 241-246):
```javascript
const state = {
  isSending: false,           // Prevents duplicate requests
  inFlightAbort: null,        // AbortController for cancellation
  conversationHistory: [],    // In-memory chat history
  uploadedFile: null          // Currently attached file
};
```

**Key Functions:**
- `processQuery(query)` - Main request handler (lines 642-778)
- `addUserMessage(message, timestamp)` - Renders user messages with date separators (lines 362-386)
- `addBotBubble(initialText, source, timestamp)` - Renders bot messages (lines 389-412)
- `pushHistory(role, text)` - Saves to memory + IndexedDB (lines 562-581)
- `loadHistoryFromDB()` - Restores chat on page load (lines 621-637)
- `clearChatHistory()` - Clears all history (lines 1151-1228)

### Worker Request Handling (worker/src/index.js)

**Chat Endpoint (`/chat`):**
- Accepts JSON or multipart/form-data
- File uploads limited to 1MB (line 5)
- Extracts text from PDF, DOCX, TXT, CSV, JSON files
- Sends to Claude API with conversation history
- Returns JSON: `{ reply: "..." }`

**TTS Endpoint (`/tts`):**
- Accepts `{ text: "..." }` JSON payload
- Uses Cloudflare AI Workers binding (`env.AI`)
- Calls Deepgram Aura-2 model for text-to-speech
- Returns audio/mpeg stream

**File Extraction:**
- PDF: Regex extraction from PDF stream objects (lines 31-51)
- DOCX: XML parsing for `<w:t>` tags (lines 54-74)
- Plain text: Direct UTF-8 decode (lines 82-85)

### UI/UX Features

**Phone Frame Design:**
- iOS-inspired "phone frame" container with dynamic island (lines 84-157 in index.html)
- Status bar with live time, battery, signal indicators (lines 159-210)
- Home indicator at bottom (lines 435-442)
- Floating animation (keyframes at lines 100-102)

**Sound Effects:**
- Web Audio API-based (lines 68-168 in index.js)
- Click, hover, scroll, success sounds
- Volume configurable via `CONFIG.soundEffects.volume`
- Audio context auto-resumes on user interaction (lines 172-179)

**Language Detection:**
- Auto-redirects based on IP geolocation via ipapi.co API (lines 736-758 in index.html)
- One-time redirect per session (uses sessionStorage)
- User can manually override by selecting language

**Date Separators in Chat:**
- Automatically inserts "Today", "Yesterday", or full date labels between messages (lines 288-334 in index.js)
- Tracks last date with `lastDateKey` to avoid duplicate separators
- Resets when chat is cleared

## Testing & Debugging

### Browser Console Logging

The chatbot includes extensive console logging:
- `🚀` - Script initialization
- `✅` / `❌` - Element binding success/failure
- `📤` / `📥` - Request/response flow
- `⚠️` - Warnings and degraded mode notices
- `🔊` - Audio system events

Enable verbose logging in browser DevTools to diagnose issues.

### Common Issues

**"Cannot reach server":**
- Check `CONFIG.chatApiUrl` points to deployed worker URL (should be `https://alfredmayaki.me/chat`)
- Verify worker is deployed: `cd worker && npx wrangler tail`
- Check CORS headers in worker response

**"ANTHROPIC_API_KEY is not set":**
- Secret not configured in Cloudflare dashboard
- Run: `cd worker && npx wrangler secret put ANTHROPIC_API_KEY`

**Empty chat history on refresh:**
- IndexedDB not initialized (check for `ChatDB` global)
- Browser privacy mode may block IndexedDB
- Check browser console for persistence errors

**File upload fails:**
- File exceeds 1MB limit (check `CONFIG.maxFileSize`)
- Unsupported file type (only .txt, .pdf, .docx, .csv, .json, .md supported)
- Worker text extraction may fail for complex PDFs/DOCX (convert to .txt)

### Testing the Worker Locally

```bash
cd worker
npx wrangler dev

# In another terminal:
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Claude"}'

# Test with history:
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What did I ask before?","history":[{"role":"user","text":"Hello"},{"role":"bot","text":"Hi there!"}]}'

# Test TTS:
curl -X POST http://localhost:8787/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}' \
  --output test.mp3
```

## Code Style & Conventions

### JavaScript
- IIFE wrapper for main chatbot script to avoid global pollution (index.js line 1)
- Strict mode enabled (`'use strict';`)
- Element references cached in `elements` object (lines 9-23)
- Early validation guards to fail gracefully when DOM elements missing
- Defensive try-catch blocks for non-critical operations
- Async/await for all fetch operations with AbortController for timeouts

### Naming Conventions
- Global helpers prefixed with `__` (e.g., `window.__setUploadedFile`, `window.__openChatbot`)
- CSS variables use kebab-case with semantic names (e.g., `--js-yellow`, `--bg-dark`)
- Function names use camelCase (e.g., `addUserMessage`, `processQuery`)
- Constants in UPPER_SNAKE_CASE (e.g., `CONFIG`, `MAX_FILE_SIZE`)

### Error Handling
- Never throw errors that crash the UI
- Show user-friendly error messages in chat bubble
- Log detailed errors to console for debugging
- Use `catch(() => '')` or `catch(() => null)` to provide safe fallbacks

## UI/UX Conventions

From `.github/copilot-instructions.md`, key design preferences include:

**Chat Interface:**
- Bot messages align left, user messages align right with cascading offsets
- Distinct rounded bubble styles with entrance animations
- Input and upload controls rounded, centered, max-width 360px
- Mobile-responsive: full-width inset (12px) with ~70vh max-height
- Black skin tone emojis preferred in chat UI

**Select/Dropdown Styling:**
- Use native browser styling for `<select>` controls
- Dark theme, rounded corners, custom caret SVG
- Brand blue accent color on hover/focus
- Larger font-size, padding, min-height on mobile
- Horizontal centering, full-width on small screens

**Icon Preferences:**
- Font Awesome icons for social links (contact page)
- "Report a bug" link in footer (instead of Discord invite)

## Security Considerations

- **Never commit API keys** - Use Cloudflare secrets or environment variables
- **File upload validation** - 1MB size limit enforced in both client and worker
- **CORS properly configured** - Worker allows all origins with appropriate headers
- **No sensitive data in URLs** - All data sent via POST body
- **Session cookies are httpOnly** - Prevents XSS access (server.js lines 113-118)
- **Firebase Admin SDK** - Service account JSON should never be committed (in .gitignore)

## Deployment Checklist

Before deploying changes:

1. **Test locally** with `wrangler dev` and local server
2. **Update CONFIG.chatApiUrl** to production URL before committing
3. **Deploy worker first**: `cd worker && npx wrangler deploy`
4. **Commit and push** static files to GitHub (auto-deploys to GitHub Pages)
5. **Test production** - Open site and send a chat message
6. **Monitor logs**: `cd worker && npx wrangler tail`
7. **Check analytics** (Google Analytics ID: G-CNF86BSG95)

### Optional: Heroku Deployment (Node.js Backend)

If deploying the optional Node.js backend to Heroku:

```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set CLAUDE_API_KEY=sk-ant-...

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

Note: The Procfile is already configured with `web: node server.js`

## Dependencies & Updates

### Frontend (Static)
- particles.js (CDN: cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0)
- Google Fonts: JetBrains Mono, Inter
- No build step required

### Worker
```bash
cd worker
npm outdated
npm update
npx wrangler deploy
```

### Node Backend (if used)
```bash
npm outdated
npm update
npm start
```

Keep dependencies updated for security patches, especially:
- `@anthropic-ai/sdk`
- `express`
- `multer`
- `firebase-admin`
