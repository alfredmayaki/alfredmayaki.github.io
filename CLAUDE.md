# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website (alfredmayaki.github.io) with an integrated AI chatbot powered by Claude Opus 4.6. Multilingual support (16 language variants), professional profile, research work, and interactive AI assistant.

**Tech Stack:** HTML5/CSS3/JS (ES5) frontend on GitHub Pages, Cloudflare Workers API proxy (`worker/src/index.js`), optional Node.js/Express backend (`server.js`), Firebase Admin SDK, IndexedDB for client-side chat persistence, particles.js for visual effects.

## Architecture

### Three-Tier System

1. **Static Frontend (GitHub Pages)** - `index.html` (main landing page with phone-frame UI), `index.js` (chatbot logic), language variants (`index_en.html`, `index_fr.html`, etc.), content pages (`ai.html`, `about.html`, `research.html`, `projects.html`, `contact.html`). No build step; CSS is inline in HTML files using a dark theme with code-inspired color palette.

2. **Cloudflare Worker Proxy (`worker/src/index.js`)** - Deployed at `alfredmayaki.me/chat`. Routes chat to Anthropic Claude API. Handles file uploads (PDF, DOCX, TXT, CSV, JSON) with 1MB limit. TTS endpoint at `/tts` using Cloudflare AI binding (Deepgram Aura-2). Configured via `worker/wrangler.toml`.

3. **Optional Node.js Backend (`server.js`)** - Express server with `/api/claude`, `/api/gpt`, `/api/upload` endpoints and Firebase session management. Production traffic uses Cloudflare Workers, not this server.

### Chat Flow

```
index.js (processQuery) → POST alfredmayaki.me/chat → worker/src/index.js (callAnthropicAPI) → api.anthropic.com/v1/messages
```

- Conversation history stored in-memory (`state.conversationHistory`), persisted to IndexedDB via `ChatDB`
- History limited to `CONFIG.maxHistoryTurns * 2` messages, sent with each request
- File uploads: stored in `state.uploadedFile`, sent as FormData, worker extracts text and injects as document context

## Development Commands

### Cloudflare Worker (primary backend)

```bash
cd worker
npm install
npm run dev          # Local dev server on port 8787 (wrangler dev)
npm run deploy       # Deploy to Cloudflare (wrangler deploy)
npm test             # Run tests (vitest)
npx wrangler tail    # View live production logs
```

### Node.js Backend (optional, for local dev)

```bash
npm install
npm start            # Start on port 3000 (node server.js)
```

### Full Local Stack Testing

1. `cd worker && npx wrangler dev` (starts worker on port 8787)
2. Update `CONFIG.chatApiUrl` in `index.js` to `http://localhost:8787/chat`
3. Serve static files with any server (e.g., `python -m http.server 8000`)
4. Test worker directly:
```bash
curl -X POST http://localhost:8787/chat -H "Content-Type: application/json" -d '{"message":"Hello"}'
```

### Environment Variables

**Worker secrets** (set via `cd worker && npx wrangler secret put <NAME>`):
- `ANTHROPIC_API_KEY` - Required for Claude API

**Worker vars** (in `worker/wrangler.toml`):
- `AI_MODEL` (default: `claude-opus-4-6`)
- `AI_PROVIDER` (default: `anthropic`)

**Node.js** (`.env` or environment):
- `CLAUDE_API_KEY`, `CLAUDE_API_URL`, `OPENAI_API_KEY`, `PORT` (default: 3000)

## Key Files

- `index.html` - Main landing page with language selector, phone-frame UI, particles.js
- `index.js` - Chatbot frontend: UI rendering, API calls, history management, sound effects, file uploads (~1200 lines, IIFE with strict mode)
- `worker/src/index.js` - Cloudflare Worker: chat proxy, file text extraction, TTS endpoint (~350 lines, ES modules)
- `server.js` - Optional Express backend (~375 lines)
- `worker/wrangler.toml` - Worker routes and config
- `ai.html` - Full-screen chatbot page

## Code Conventions

### JavaScript Patterns
- IIFE wrapper for `index.js` to avoid global pollution
- `'use strict'` mode
- Element references cached in `elements` object at top of IIFE
- Global helpers prefixed with `__` (e.g., `window.__setUploadedFile`, `window.__openChatbot`)
- Async/await with `AbortController` for all fetch operations
- Defensive try-catch; never throw errors that crash the UI
- `catch(() => '')` or `catch(() => null)` for safe fallbacks

### Naming
- Functions: camelCase (`processQuery`, `addUserMessage`)
- Constants: UPPER_SNAKE_CASE (`CONFIG`, `MAX_FILE_SIZE`)
- CSS variables: kebab-case with semantic names (`--js-yellow`, `--bg-dark`)

### Chatbot State (`index.js`)
Central `state` object with `isSending`, `inFlightAbort`, `conversationHistory`, `uploadedFile`. Key functions: `processQuery()` (main handler), `addUserMessage()`, `addBotBubble()`, `pushHistory()`, `loadHistoryFromDB()`, `clearChatHistory()`.

### Worker Endpoints (`worker/src/index.js`)
- `POST /chat` - Accepts JSON or multipart/form-data. Returns `{ reply: "..." }`. File extraction: PDF via regex on stream objects, DOCX via XML `<w:t>` parsing, plaintext via UTF-8 decode.
- `POST /tts` - Accepts `{ text: "..." }`, returns audio/mpeg via Cloudflare AI (Deepgram Aura-2).

## UI/UX Preferences

From `.github/copilot-instructions.md`:
- iOS-inspired phone frame with dynamic island, status bar (live time, battery, signal), floating animation
- Bot messages left-aligned, user messages right-aligned with cascading bubble offsets
- Rounded animated chat bubbles; input/upload controls rounded, centered, max-width 360px
- Native browser `<select>` styling with `appearance: none`, dark theme, custom caret SVG, brand blue accent on hover/focus
- Mobile: full-width inset (12px), ~70vh max-height, touch-friendly controls
- Black skin tone emojis in chat UI
- Font Awesome icons for social links on contact page
- "Report a bug" link in footer (not Discord invite)
- Web Audio API sound effects (click, hover, scroll, success) with configurable volume
- Auto language redirect via IP geolocation (ipapi.co), once per session

## Deployment

1. Test locally with `wrangler dev` and local file server
2. Ensure `CONFIG.chatApiUrl` points to `https://alfredmayaki.me/chat` before committing
3. Deploy worker: `cd worker && npx wrangler deploy`
4. Push static files to GitHub (auto-deploys to GitHub Pages)
5. Verify: open site and send a chat message
6. Monitor: `cd worker && npx wrangler tail`

## Debugging

Browser console emoji prefixes: `🚀` init, `✅`/`❌` element binding, `📤`/`📥` request/response, `⚠️` warnings, `🔊` audio.

Common issues:
- **"Cannot reach server"**: Check `CONFIG.chatApiUrl`, verify worker deployment, check CORS headers
- **"ANTHROPIC_API_KEY is not set"**: Run `cd worker && npx wrangler secret put ANTHROPIC_API_KEY`
- **Empty chat on refresh**: IndexedDB not initialized or blocked by privacy mode
- **File upload fails**: Exceeds 1MB limit, unsupported type, or complex PDF/DOCX extraction failure
