document.addEventListener('DOMContentLoaded', function () {
    async function callServerGpt(prompt) {
      try {
        const resp = await fetch('/api/gpt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-5.2', prompt }) });
        if (!resp.ok) throw new Error('network');
        var json = await resp.json().catch(function() { return {}; });
        json.reply = String(json.reply || json.text || json.message || '').trim();
        if (!json.timestamp) json.timestamp = new Date().toISOString();
        return json;
      } catch (err) {
        return { reply: 'Simulated reply — GPT endpoint not reachable.' };
      }
    }

    function formatTimeOnly(date) {
      try { return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date); }
      catch (e) { return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    }

    var lastAppendDateKey = null;
    function getDateKey(date) { return date.toISOString().split('T')[0]; }
    function formatDateLabel(date) {
      var today = new Date(), yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      var dk = getDateKey(date);
      if (dk === getDateKey(today)) return { label: 'Today', className: 'today' };
      if (dk === getDateKey(yesterday)) return { label: 'Yesterday', className: 'yesterday' };
      try { return { label: new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date), className: '' }; }
      catch (e) { return { label: date.toDateString(), className: '' }; }
    }
    function ensureDateSeparatorForContainer(container, date) {
      var dk = getDateKey(date);
      if (dk !== lastAppendDateKey) {
        lastAppendDateKey = dk;
        var info = formatDateLabel(date), sep = document.createElement('div');
        sep.className = 'date-separator' + (info.className ? ' ' + info.className : '');
        sep.innerHTML = '<span>' + info.label + '</span>';
        container.appendChild(sep);
      }
    }

    function appendChatMessage(text, role, containerId, timestamp) {
      if (!role) role = 'bot';
      if (!containerId) containerId = 'chatbotMessages';
      var messages = document.getElementById(containerId);
      if (!messages) return null;
      var msgDate = timestamp ? new Date(timestamp) : new Date();
      ensureDateSeparatorForContainer(messages, msgDate);
      var row = document.createElement('div');
      row.className = 'message ' + (role === 'user' ? 'user' : 'bot');
      var inner = document.createElement('div'); inner.className = 'message-row-inner';
      var bubble = document.createElement('div'); bubble.className = 'message-bubble'; bubble.textContent = text;
      var meta = document.createElement('div'); meta.className = 'message-meta';
      if (role === 'user') meta.innerHTML = '<span class="message-author">You</span> ' + formatTimeOnly(msgDate);
      else meta.textContent = formatTimeOnly(msgDate);
      inner.appendChild(bubble); row.appendChild(inner); row.appendChild(meta); messages.appendChild(row);
      try { messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' }); } catch (e) { try { messages.scrollTop = messages.scrollHeight; } catch (e2) {} }
      return row;
    }

    function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

    window.__sendPromptToGpt = async function (prompt) {
      if (!prompt || !String(prompt).trim()) return;
      prompt = String(prompt).trim();
      var gptPopup = document.getElementById('gptPopup');
      if (gptPopup) { gptPopup.classList.add('active'); gptPopup.classList.remove('minimized'); try { gptPopup.setAttribute('aria-hidden', 'false'); } catch (e) {} }
      appendChatMessage('💬 ' + prompt, 'user', 'gptMessages');
      var btn = document.getElementById('gptNewBtn');
      if (btn) { btn.disabled = true; }
      var typing = appendChatMessage('Thinking...', 'bot', 'gptMessages');
      var result;
      try { result = await callServerGpt(prompt); } catch (err) { result = { reply: 'Simulated reply — GPT endpoint not reachable.' }; }
      try { if (typing && typing.remove) typing.remove(); } catch (err) {}
      var reply = String(result && result.reply || '(empty reply)');
      var row = appendChatMessage(reply, 'bot', 'gptMessages');
      try { var meta = row && row.querySelector('.message-meta'); if (meta) { var ts = result && result.timestamp ? new Date(result.timestamp) : new Date(); meta.innerHTML = '<span class="message-source">OpenAI</span> ' + formatTimeOnly(ts); } } catch (e) {}
      if (btn) { btn.disabled = false; }
    };

    window.appendChatMessage = appendChatMessage;
    window.__openChatbot = function () {
      var chatbotPopup = document.getElementById('chatbotPopup');
      if (chatbotPopup) { chatbotPopup.classList.add('active'); chatbotPopup.classList.remove('minimized'); setTimeout(function() { var ci = document.getElementById('chatbotInput'); if (ci) ci.focus(); }, 120); }
    };
    window.appendChatLink = function (query, role) {
      if (!role) role = 'user';
      var messages = document.getElementById('chatbotMessages');
      if (!messages) return null;
      var row = document.createElement('div'); row.className = 'message ' + (role === 'user' ? 'user' : 'bot');
      var inner = document.createElement('div'); inner.className = 'message-row-inner';
      var bubble = document.createElement('div'); bubble.className = 'message-bubble';
      var a = document.createElement('a'); a.href = '#'; a.textContent = query; a.style.color = 'var(--brand)'; a.style.textDecoration = 'underline';
      a.addEventListener('click', function(ev) { ev.preventDefault(); var si = document.getElementById('searchInput'); if (si) si.value = query; if (typeof trackSearch === 'function') trackSearch(query); var ci = document.getElementById('chatbotInput'); if (ci) ci.focus(); });
      bubble.appendChild(a);
      var meta = document.createElement('div'); meta.className = 'message-meta'; meta.textContent = formatTimeOnly(new Date());
      inner.appendChild(bubble); row.appendChild(inner); row.appendChild(meta); messages.appendChild(row);
      messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
      return row;
    };
  });

  (function () {
    var input = document.getElementById('chatbotInput');
    var messages = document.getElementById('chatbotMessages');
    var lastDateKey = null;

    function getDateKey(date) { return date.toISOString().split('T')[0]; }
    function formatDateLabel(date) {
      var today = new Date(), yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      var dk = getDateKey(date);
      if (dk === getDateKey(today)) return { label: 'Today', className: 'today' };
      if (dk === getDateKey(yesterday)) return { label: 'Yesterday', className: 'yesterday' };
      try { return { label: new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date), className: '' }; }
      catch (e) { return { label: date.toDateString(), className: '' }; }
    }
    function ensureDateSeparator(date) {
      var dk = getDateKey(date);
      if (dk !== lastDateKey) { lastDateKey = dk; var info = formatDateLabel(date), sep = document.createElement('div'); sep.className = 'date-separator' + (info.className ? ' ' + info.className : ''); sep.innerHTML = '<span>' + info.label + '</span>'; if (messages) messages.appendChild(sep); }
    }
    function ensureYearSeparator(date) { ensureDateSeparator(date); }
    function formatTimeOnly(date) {
      try { return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date); }
      catch (e) { return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    }

    function createMessageEl(text, role, date) {
      if (!date) date = new Date();
      ensureYearSeparator(date);
      var row = document.createElement('div'); row.className = 'message ' + (role === 'user' ? 'user' : 'bot');
      var inner = document.createElement('div'); inner.className = 'message-row-inner';
      var avatar = document.createElement('div'); avatar.className = 'message-avatar';
      if (role === 'user') {
        var img = document.createElement('img'); img.className = 'avatar-img'; img.alt = 'You'; img.src = '/default.jpg';
        img.onerror = function () { try { this.onerror = null; this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%232a2a2a"/><text x="50%" y="50%" dy=".35em" fill="%23ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="28" text-anchor="middle">U</text></svg>'; } catch (e) { this.style.display = 'none'; } };
        avatar.appendChild(img);
      } else { avatar.textContent = 'C'; }
      var bubble = document.createElement('div'); bubble.className = 'message-bubble'; bubble.textContent = (role === 'user') ? '💬 ' + text : text;
      var meta = document.createElement('div'); meta.className = 'message-meta';
      try { var time = formatTimeOnly(date); if (role === 'user') meta.innerHTML = '<span class="message-author">You</span> ' + time; else meta.textContent = time; }
      catch (err) { var fb = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); if (role === 'user') meta.innerHTML = '<span class="message-author">You</span> ' + fb; else meta.textContent = fb; }
      inner.appendChild(avatar); inner.appendChild(bubble); row.appendChild(inner); row.appendChild(meta);
      return row;
    }

    function scrollToBottom() { if (messages) messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' }); }

    async function sendMessage() {
      if (!input) return;
      var text = input.value ? input.value.trim() : '';
      if (!text) return;
      var now = new Date();
      var isGpt = window.__lastChatTarget === 'gpt';
      if (isGpt) {
        messages.appendChild(createMessageEl(text, 'user', now)); input.value = ''; input.focus(); scrollToBottom();
        var typingRow = createMessageEl('Thinking...', 'bot', new Date()); messages.appendChild(typingRow); scrollToBottom();
        try {
          var resp = await fetch('/api/gpt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-5.2', prompt: text }) });
          var json = resp.ok ? await resp.json().catch(function() { return {}; }) : {};
          json.reply = String(json.reply || json.text || json.message || '').trim();
          var botText = json.reply || '(empty reply)';
          try { typingRow.remove(); } catch (e) {}
          var ts = json.timestamp ? new Date(json.timestamp) : new Date();
          var botRow = createMessageEl(botText, 'bot', ts);
          try { var m = botRow.querySelector('.message-meta'); if (m) m.innerHTML = '<span class="message-source">OpenAI</span> ' + formatTimeOnly(ts); } catch (e) {}
          messages.appendChild(botRow); scrollToBottom();
        } catch (err) { try { typingRow.remove(); } catch (e) {} messages.appendChild(createMessageEl('Simulated reply — GPT backend not reachable.', 'bot', new Date())); scrollToBottom(); }
      } else {
        try {
          if (typeof addUserMessage === 'function') addUserMessage(text); else messages.appendChild(createMessageEl(text, 'user', now));
          if (typeof pushHistory === 'function') pushHistory('user', text);
          input.value = ''; input.focus(); scrollToBottom();
          if (typeof processQuery === 'function') { void processQuery(text); }
          else {
            var tRow = createMessageEl('Thinking...', 'bot', new Date()); messages.appendChild(tRow); scrollToBottom();
            try {
              var r = await fetch('https://alfredmayaki.me/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, stream: false, history: [] }) });
              var j = await r.json().catch(function() { return null; }); try { tRow.remove(); } catch (e) {}
              var bt = String(j && (j.reply || j.text || j.message) || '(empty reply)');
              var t = j && j.timestamp ? new Date(j.timestamp) : new Date();
              var br = createMessageEl(bt, 'bot', t);
              try { var mm = br.querySelector('.message-meta'); if (mm) mm.innerHTML = '<span class="message-source">Claude</span> ' + formatTimeOnly(t); } catch (e) {}
              messages.appendChild(br); scrollToBottom();
            } catch (err) { try { tRow.remove(); } catch (e) {} messages.appendChild(createMessageEl('Simulated reply — chat backend not reachable.', 'bot', new Date())); scrollToBottom(); }
          }
        } catch (e) { console.warn('Error in Claude send flow', e); }
      }
    }

    var chatSendBtn = document.getElementById('chatSend');
    if (chatSendBtn) chatSendBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var msg = (typeof normalizeUserText === 'function') ? normalizeUserText(document.getElementById('chatbotInput').value) : (document.getElementById('chatbotInput').value || '').trim();
      if (!msg) return;
      if (typeof addUserMessage === 'function') addUserMessage(msg);
      if (typeof pushHistory === 'function') pushHistory('user', msg);
      if (typeof processQuery === 'function') void processQuery(msg);
      document.getElementById('chatbotInput').value = '';
      document.getElementById('chatbotInput').focus();
    });

    window.__chatSendMessage = sendMessage;
  });
