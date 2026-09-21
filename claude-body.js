// Theme background — particles.js
(function () {
  var el = document.getElementById('particles-js');
  if (!el) return;
  function init() {
    if (typeof particlesJS === 'undefined' || typeof particlesJS.load !== 'function') return;
    particlesJS.load('particles-js', 'particles.json', function () {
      console.log('Particles.js loaded');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Unified popup handlers for GPT and main chatbot
(function () {
  function setupPopup(popupId, minimizeId, closeId, headerId, inputId) {
    var popup = document.getElementById(popupId);
    if (!popup) return;
    var minBtn = document.getElementById(minimizeId);
    var closeBtn = document.getElementById(closeId);
    var header = document.getElementById(headerId);

    function updateMinBtn(isMin) {
      if (!minBtn) return;
      try {
        minBtn.textContent = isMin ? '□' : '−';
        minBtn.title = isMin ? 'Restore' : 'Minimize';
        minBtn.setAttribute('aria-label', isMin ? 'Restore ' + popupId : 'Minimize ' + popupId);
      } catch (e) {}
    }

    if (minBtn) minBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isMin = popup.classList.toggle('minimized');
      updateMinBtn(isMin);
      if (!isMin && !popup.classList.contains('active')) {
        popup.classList.add('active');
        try { popup.setAttribute('aria-hidden', 'false'); } catch (e) {}
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      popup.classList.remove('active');
      try { popup.setAttribute('aria-hidden', 'true'); } catch (e) {}
    });

    if (header) header.addEventListener('click', function (e) {
      if (popup.classList.contains('minimized') && !e.target.closest('button')) {
        var isMin = popup.classList.toggle('minimized');
        updateMinBtn(isMin);
        if (!isMin && inputId) {
          try { var input = document.getElementById(inputId); if (input) setTimeout(function () { input.focus(); }, 100); } catch (e) {}
        }
      }
    });
  }

  setupPopup('gptPopup', 'minimizeGpt', 'closeGpt', 'gptHeader', null);
})();

// Clear chat modal handler
document.addEventListener('DOMContentLoaded', function () {
  var clearBtn = document.getElementById('clearChat'), modal = document.getElementById('clearChatModal'), btnCancel = document.getElementById('clearChatCancel'), btnConfirm = document.getElementById('clearChatConfirm');
  if (!clearBtn || !modal || !btnCancel || !btnConfirm) return;
  function showModal() { modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false'); try { btnConfirm.focus(); } catch (e) {} }
  function hideModal() { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); try { clearBtn.focus(); } catch (e) {} }
  clearBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); showModal(); });
  btnCancel.addEventListener('click', function(e) { e.preventDefault(); hideModal(); });
  btnConfirm.addEventListener('click', function(e) { e.preventDefault(); try { if (window.clearChatHistory && typeof window.clearChatHistory === 'function') void window.clearChatHistory(); else { var msgs = document.getElementById('chatbotMessages'); if (msgs) msgs.innerHTML = ''; } } catch (err) {} hideModal(); });
  modal.addEventListener('click', function(e) { if (e.target === modal) hideModal(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && modal.classList.contains('show')) hideModal(); });
});

// Snowfall effect
(function() {
  var container = document.getElementById('snowfallContainer');
  if (!container) return;
  var flakes = ['❄', '❅', '❆', '✦', '•'];
  var count = 45;
  for (var i = 0; i < count; i++) {
    var el = document.createElement('span');
    el.className = 'snowflake';
    el.textContent = flakes[Math.floor(Math.random() * flakes.length)];
    var size = (Math.random() * 1.2 + 0.5).toFixed(2);
    var left = (Math.random() * 100).toFixed(1);
    var fallDur = (Math.random() * 8 + 6).toFixed(1);
    var swayDur = (Math.random() * 4 + 3).toFixed(1);
    var delay = (Math.random() * 10).toFixed(1);
    var opacity = (Math.random() * 0.5 + 0.3).toFixed(2);
    el.style.left = left + '%';
    el.style.fontSize = size + 'rem';
    el.style.opacity = opacity;
    el.style.animationDuration = fallDur + 's, ' + swayDur + 's';
    el.style.animationDelay = delay + 's, ' + delay + 's';
    container.appendChild(el);
  }
})();

// Typed.js animated placeholder
(function() {
  try {
    function startTyped() {
      var inputEl = document.getElementById('searchInput');
      if (!inputEl || inputEl.__typedInitialized) return;
      inputEl.__typedInitialized = true;
      var isMobile = window.innerWidth <= 600;
      var strings = isMobile ? [
        'Listening...',
        'Enter query here...',
        'Make a query...'
      ] : [
        'Listening...',
        'Enter query here...',
        'Make a query...'
      ];
      var opts = {
        strings: strings, typeSpeed: 60, backSpeed: 15,
        backDelay: 1500, loop: true, attr: 'placeholder',
        bindInputFocusEvents: true, showCursor: false
      };
      try { new Typed('searchInput', opts); } catch (err) { try { new Typed(inputEl, opts); } catch (err2) {} }
    }
    if (typeof Typed === 'function') startTyped();
    else { var s = document.createElement('script'); s.async = true; s.src = 'https://cdn.jsdelivr.net/npm/typed.js@2.0.12'; s.onload = function() { try { startTyped(); } catch(e) {} }; s.onerror = function() {}; document.head.appendChild(s); }
  } catch (err) {}
})();

// File upload handler
(function () {
  var fileInput = document.getElementById('docUploadInput'), uploadBtn = document.getElementById('docUploadBtn');
  if (!fileInput || !uploadBtn) return;
  window.uploadedDocs = window.uploadedDocs || [];
  uploadBtn.addEventListener('click', function() { fileInput.click(); });
  uploadBtn.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', async function(e) {
    var files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (var i = 0; i < files.length; i++) {
      var f = files[i], result = null;
      try { if (typeof pushChatMessage === 'function') pushChatMessage('Uploading ' + f.name + '…', 'user'); } catch (err) {}
      try { if (typeof extractFile === 'function') result = await extractFile(f); else result = { name: f.name, text: '', filename: f.name, source: 'client-fallback' }; } catch (err) { result = { name: f.name, text: '', filename: f.name, source: 'client-error' }; }
      try { window.uploadedDocs = window.uploadedDocs || []; window.uploadedDocs.push(result); } catch (err) {}
      try { if (typeof pushChatMessage === 'function') pushChatMessage('Document received: ' + f.name, 'bot'); } catch (err) {}
      try { if (typeof window.__setUploadedFile === 'function') window.__setUploadedFile(f); else window.__rawUploadedFile = f; } catch (err) {}
      try { if (typeof window.__openChatbot === 'function') window.__openChatbot(); } catch (err) {}
    }
    try {
      if (typeof renderUploadList === 'function') renderUploadList();
      else if (document.getElementById('uploadList')) { var ul = document.getElementById('uploadList'); ul.innerHTML = ''; (window.uploadedDocs || []).forEach(function(d) { var el = document.createElement('div'); el.className = 'upload-item'; el.innerHTML = '<div class="name">' + (d.filename || d.name) + '</div><div class="status">Ready</div>'; ul.appendChild(el); }); }
    } catch (err) {}
    e.target.value = '';
  });
})();

// Search Tracking
var firebaseInitialized = false;
if (window.FirebaseSearchTracking) firebaseInitialized = window.FirebaseSearchTracking.initFirebase();

async function trackSearch(query) {
  if (!query || query.trim().length === 0) return;
  var result = await SearchTrackerAPI.trackSearch(query);
  if (result.success) console.log('✅ Search tracked:', result.source);
  if (firebaseInitialized && window.FirebaseSearchTracking) {
    var stopWords = ['the','a','an','and','or','but','in','on','at','to','for','of','with','is','was','are','be','have','has','what','when','where','why','how','can','could','would','should','will'];
    var words = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(function(w) { return w.length > 2 && !stopWords.includes(w); });
    var keywords = {}; words.forEach(function(w) { keywords[w] = (keywords[w] || 0) + 1; });
    window.FirebaseSearchTracking.trackSearchFirebase(query.trim(), keywords).catch(function() {});
  }
}

document.addEventListener('DOMContentLoaded', function () {
  function appendPreSend(query) {
    try {
      if (typeof window.appendChatMessage === 'function') window.appendChatMessage('💬 ' + query, 'user', 'chatbotMessages');
      else {
        var messages = document.getElementById('chatbotMessages');
        if (messages) {
          var row = document.createElement('div'); row.className = 'message user';
          var inner = document.createElement('div'); inner.className = 'message-row-inner';
          var bubble = document.createElement('div'); bubble.className = 'message-bubble'; bubble.textContent = '💬 ' + query;
          inner.appendChild(bubble);
          var meta = document.createElement('div'); meta.className = 'message-meta';
          try { meta.textContent = new Date().toLocaleTimeString(); } catch (e) {}
          row.appendChild(inner); row.appendChild(meta); messages.appendChild(row);
          try { messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' }); } catch (e) {}
        }
      }
    } catch (err) {}
  }

  var btn = document.getElementById('searchBtn'), input = document.getElementById('searchInput');
  if (btn) btn.addEventListener('click', function () {
    var query = input ? input.value.trim() : ''; if (!query) return;
    trackSearch(query);
    try {
      if (window.__lastChatTarget === 'gpt') { void window.__sendPromptToGpt(query); return; }
      if (window.__openChatbot) window.__openChatbot();
      appendPreSend(query);
      try { window.__skipNextAutoUserAdd = true; } catch (e) {}
      var ci = document.getElementById('chatbotInput'), cs = document.getElementById('chatSend');
      if (ci) ci.value = query;
      if (cs) cs.click();
    } catch (e) {}
  });
  if (input) input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var query = String(this.value || '').trim(); if (!query) return;
      trackSearch(query);
      try {
        if (window.__lastChatTarget === 'gpt') { void window.__sendPromptToGpt(query); return; }
        if (window.__openChatbot) window.__openChatbot();
        appendPreSend(query);
        try { window.__skipNextAutoUserAdd = true; } catch (e2) {}
        var ci = document.getElementById('chatbotInput'), cs = document.getElementById('chatSend');
        if (ci) ci.value = query;
        if (cs) cs.click();
      } catch (e2) {}
    }
  });
});

// Cookie Consent
document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  var COOKIE_NAME = 'cookie_consent', COOKIE_EXPIRY_DAYS = 365;
  function setCookie(name, value, days) { var d = new Date(); d.setTime(d.getTime() + (days * 86400000)); document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Strict'; }
  function getCookie(name) { var eq = name + '=', ca = document.cookie.split(';'); for (var i = 0; i < ca.length; i++) { var c = ca[i]; while (c.charAt(0) === ' ') c = c.substring(1); if (c.indexOf(eq) === 0) return c.substring(eq.length); } return null; }
  function initGA() { var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=G-CNF86BSG95'; document.head.appendChild(s); window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-CNF86BSG95', { anonymize_ip: true, cookie_flags: 'SameSite=Strict;Secure' }); }
  function hideBanner() { var b = document.getElementById('cookieBanner'); if (b) { b.style.animation = 'slideDown 0.4s ease-out'; setTimeout(function() { b.classList.remove('show'); }, 400); } }
  var consent = getCookie(COOKIE_NAME);
  if (consent === 'accepted') initGA();
  else if (!consent) { var b = document.getElementById('cookieBanner'); if (b) b.classList.add('show'); }
  var ac = document.getElementById('acceptCookies'); if (ac) ac.addEventListener('click', function() { setCookie(COOKIE_NAME, 'accepted', COOKIE_EXPIRY_DAYS); initGA(); hideBanner(); });
  var rc = document.getElementById('rejectCookies'); if (rc) rc.addEventListener('click', function() { setCookie(COOKIE_NAME, 'rejected', COOKIE_EXPIRY_DAYS); hideBanner(); });
  var lm = document.getElementById('learnMore'); if (lm) lm.addEventListener('click', function(e) { e.preventDefault(); alert('Cookie Policy\n\nWe use Google Analytics to:\n• Understand how visitors use our website\n• Improve user experience\n• Analyze site traffic and performance\n\nYou can change your preferences at any time by clearing your browser cookies and refreshing the page.'); });
  var st = document.createElement('style'); st.textContent = '@keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }'; document.head.appendChild(st);
});

// WebAudio tick + menu timestamps
document.addEventListener('DOMContentLoaded', function () {
  var selects = [document.getElementById('navigationSelect'), document.getElementById('languageSelect')].filter(Boolean);
  if (!selects.length) return;
  var AudioCtx = window.AudioContext || window.webkitAudioContext, audioCtx = AudioCtx ? new AudioCtx() : null, userInteracted = false;
  function enableSound() { userInteracted = true; if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); window.removeEventListener('pointerdown', enableSound); window.removeEventListener('keydown', enableSound); }
  window.addEventListener('pointerdown', enableSound, { once: true }); window.addEventListener('keydown', enableSound, { once: true });
  function playTick() { if (!audioCtx || !userInteracted) return; var now = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(1100, now); g.gain.setValueAtTime(0.0001, now); o.connect(g); g.connect(audioCtx.destination); o.start(now); g.gain.exponentialRampToValueAtTime(0.06, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12); o.stop(now + 0.14); }
  selects.forEach(function(sel) { var li = sel.selectedIndex; sel.addEventListener('change', function() { playTick(); li = sel.selectedIndex; }); sel.addEventListener('keydown', function(e) { if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(e.key)) setTimeout(function() { if (sel.selectedIndex !== li) { playTick(); li = sel.selectedIndex; } }, 60); }); });

  // Menu timestamp tracking
  (function () {
    var NAV_SEL = '.top-nav .nav-links a', SEL_IDS = ['navigationSelect','languageSelect'], PFX = 'menu_ts_';
    function nowISO() { return new Date().toISOString(); }
    function fmt(iso) { try { return new Date(iso).toLocaleString([], { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short', year:'numeric' }); } catch(e) { return iso; } }
    function sKey(k) { return PFX + k; }
    function badge(a, k) { if (!a) return; var s = a.querySelector('.menu-ts'); if (!s) { s = document.createElement('span'); s.className = 'menu-ts'; a.appendChild(s); } var v = localStorage.getItem(sKey(k)); s.textContent = v ? fmt(v) : '—'; s.title = v || ''; }
    function record(k) { var ts = nowISO(); localStorage.setItem(sKey(k), ts); document.querySelectorAll(NAV_SEL).forEach(function(a) { var h = a.getAttribute('href') || a.textContent.trim(); if (h === k) badge(a, k); }); SEL_IDS.forEach(function(id) { var s = document.getElementById(id); if (s && s.value === k) s.setAttribute('data-last-activated', ts); }); }
    function init() {
      document.querySelectorAll(NAV_SEL).forEach(function(a) { var h = a.getAttribute('href') || a.textContent.trim(); badge(a, h); a.addEventListener('click', function() { try { record(h); } catch(e) {} }); });
      SEL_IDS.forEach(function(id) { var s = document.getElementById(id); if (!s) return; s.addEventListener('change', function() { var v = String(s.value || '').trim(); if (v) record(v); }); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    window.__recordMenuTimestamp = record;
  })();
});
