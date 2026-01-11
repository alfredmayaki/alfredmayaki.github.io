(function () {
  'use strict';

  console.log('🚀 Chatbot script loaded');

  // ========================================
  // DOM ELEMENT REFERENCES
  // ========================================
  const elements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    docsBtn: document.getElementById('docsBtn'),
    chatbotPopup: document.getElementById('chatbotPopup'),
    chatbotMessages: document.getElementById('chatbotMessages'),
    chatbotInput: document.getElementById('chatbotInput'),
    closeChat: document.getElementById('closeChat'),
    bgMusic: document.getElementById('bgMusic'),
    musicBtn: document.getElementById('musicBtn'),
    languageSelect: document.getElementById('languageSelect')
  };

  // Debug: Log which elements were found
  Object.keys(elements).forEach(key => {
    if (!elements[key]) console.error(`❌ Missing element: ${key}`);
    else console.log(`✅ Found element: ${key}`);
  });

  // Early exit if critical elements are missing
  if (!elements.searchInput || !elements.searchBtn || !elements.chatbotPopup || 
      !elements.chatbotMessages || !elements.chatbotInput || !elements.closeChat) {
    console.error('❌ Critical chatbot elements not found');
    return;
  }

  // ========================================
  // CONFIGURATION
  // ========================================
  const CONFIG = {
    chatApiUrl: '/chat',  
    maxMessageChars: 1000,
    requestTimeoutMs: 30000,
    maxHistoryTurns: 6,
    welcomeMessage: '👋 Hello! I\'m powered by Google Gemini. Ask me anything about Alfred Mayaki or any topic you\'d like to explore.'
  };

  console.log('⚙️ Config:', CONFIG);

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const state = {
    isSending: false,
    inFlightAbort: null,
    conversationHistory: []
  };

  // ========================================
  // PARTICLES.JS INITIALIZATION
  // ========================================
  if (typeof particlesJS !== 'undefined') {
    particlesJS.load('particles-js', 'particles.json', function() {
      console.log('✨ Particles.js loaded');
    });
  } else {
    console.warn('⚠️ particlesJS not found');
  }

  // ========================================
  // LANGUAGE SELECTOR
  // ========================================
  if (elements.languageSelect) {
    elements.languageSelect.addEventListener('change', function () {
      const target = String(elements.languageSelect.value || '').trim();
      if (!target) return;

      sessionStorage.setItem('lang_redirected', '1');
      window.location.href = target;
    });
  }

  // ========================================
  // MUSIC PLAYER FUNCTIONALITY
  // ========================================
  function setMusicButtonState(isPlaying) {
    if (!elements.musicBtn) return;

    elements.musicBtn.textContent = isPlaying ? 'Pause music' : 'Play music';
    elements.musicBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  }

  async function tryAutoplayMusic() {
    if (!elements.bgMusic) return false;

    try {
      await elements.bgMusic.play();
      setMusicButtonState(true);
      return true;
    } catch (error) {
      console.log('🔇 Autoplay blocked (expected)', error.message);
      setMusicButtonState(false);
      return false;
    }
  }

  async function toggleMusic() {
    if (!elements.bgMusic || !elements.musicBtn) return;

    if (elements.bgMusic.paused) {
      const ok = await tryAutoplayMusic();
      if (!ok) {
        elements.musicBtn.textContent = 'Tap to enable music';
      }
      return;
    }

    elements.bgMusic.pause();
    setMusicButtonState(false);
  }

  // Initialize music controls
  if (elements.musicBtn && elements.bgMusic) {
    setMusicButtonState(!elements.bgMusic.paused);

    elements.musicBtn.addEventListener('click', function () {
      console.log('🎵 Music button clicked');
      void toggleMusic();
    });

    elements.bgMusic.addEventListener('play', function () { 
      setMusicButtonState(true); 
    });
    
    elements.bgMusic.addEventListener('pause', function () { 
      setMusicButtonState(false); 
    });
  }

  // Attempt autoplay after first meaningful user gesture
  const unlockMusicOnce = function () {
    document.removeEventListener('pointerdown', unlockMusicOnce);
    document.removeEventListener('keydown', unlockMusicOnce);
    void tryAutoplayMusic();
  };

  document.addEventListener('pointerdown', unlockMusicOnce, { once: true });
  document.addEventListener('keydown', unlockMusicOnce, { once: true });

  // ========================================
  // CHATBOT UI FUNCTIONS
  // ========================================
  function openChatbot() {
    console.log('💬 Opening chatbot');
    const query = elements.searchInput.value.trim();
    elements.chatbotPopup.classList.add('active');

    if (!query) {
      console.log('No query provided, focusing input');
      elements.chatbotInput.focus();
      return;
    }

    console.log('Processing query:', query);
    addUserMessage(query);
    processQuery(query);
    elements.searchInput.value = '';
  }

  function closeChatbot() {
    console.log('Closing chatbot');
    elements.chatbotPopup.classList.remove('active');
  }

  function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = '<div class="message-bubble"></div>';
    messageDiv.querySelector('.message-bubble').textContent = message;
    elements.chatbotMessages.appendChild(messageDiv);
    scrollToBottom();
  }

  function addBotBubble(initialText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.innerHTML = '<div class="message-bubble"></div>';
    const bubble = messageDiv.querySelector('.message-bubble');
    bubble.textContent = initialText || '';
    elements.chatbotMessages.appendChild(messageDiv);
    scrollToBottom();
    return bubble;
  }

  function scrollToBottom() {
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  function normalizeUserText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function setInputEnabled(enabled) {
    elements.chatbotInput.disabled = !enabled;
    elements.searchInput.disabled = !enabled;
  }

  function pushHistory(role, text) {
    state.conversationHistory.push({ role, text });
    const maxItems = CONFIG.maxHistoryTurns * 2;
    if (state.conversationHistory.length > maxItems) {
      state.conversationHistory.splice(0, state.conversationHistory.length - maxItems);
    }
  }

  // ========================================
  // CHATBOT API COMMUNICATION
  // ========================================
  async function processQuery(query) {
    const text = normalizeUserText(query);
    if (!text) return;

    console.log('📤 Processing query:', text);

    if (text.length > CONFIG.maxMessageChars) {
      addBotBubble(`Message too long. Please keep it under ${CONFIG.maxMessageChars} characters.`);
      return;
    }

    if (state.isSending) {
      console.warn('⚠️ Already sending a request, ignoring');
      return;
    }

    state.isSending = true;
    setInputEnabled(false);

    const bubble = addBotBubble('Thinking...');

    const controller = new AbortController();
    state.inFlightAbort = controller;

    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Request timeout');
      controller.abort('timeout');
    }, CONFIG.requestTimeoutMs);

    try {
      const payload = {
        message: text,
        stream: false,
        history: state.conversationHistory
      };

      console.log('📡 Sending request to:', CONFIG.chatApiUrl);
      console.log('📦 Payload:', payload);

      const response = await fetch(CONFIG.chatApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      console.log('📥 Response status:', response.status);

      const raw = await response.text().catch(() => '');
      console.log('📥 Response body:', raw);
      
      if (!response.ok) {
        const errorMsg = `Server error: ${response.status}. ${raw}`;
        console.error('❌', errorMsg);
        bubble.textContent = errorMsg;
        return;
      }

      let data;
      try {
        data = raw ? JSON.parse(raw) : null;
        console.log('📥 Parsed data:', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        bubble.textContent = 'Invalid response from server. Please verify your backend setup.';
        return;
      }

      const reply = String(data?.reply || '').trim();
      console.log('💬 Reply:', reply);
      bubble.textContent = reply || '(empty reply)';
      pushHistory('bot', bubble.textContent);
      
    } catch (error) {
      console.error('❌ Fetch error:', error);
      console.error('Error name:', error?.name);`
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      if (String(error?.name) === 'AbortError') {
        bubble.textContent = 'Request timed out. Please try again.';
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        bubble.textContent = 'Cannot reach server. Possible reasons:\n1. Worker not deployed\n2. CORS issue\n3. Network problem\n\nCheck browser console for details.';
      } else {
        bubble.textContent = `Network error: ${String(error?.message || error)}`;
      }
    } finally {
      clearTimeout(timeoutId);
      state.inFlightAbort = null;
      state.isSending = false;
      setInputEnabled(true);
      elements.chatbotInput.focus();
      scrollToBottom();
      console.log('✅ Request complete');
    }
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================

  // Search button and input
  elements.searchBtn.addEventListener('click', function () {
    console.log('🔍 Search button clicked');
    void tryAutoplayMusic();
    openChatbot();
  });

  elements.searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      console.log('⏎ Enter pressed in search input');
      void tryAutoplayMusic();
      openChatbot();
    }
  });

  // Chatbot input
  elements.chatbotInput.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    console.log('⏎ Enter pressed in chatbot input');

    const message = normalizeUserText(elements.chatbotInput.value);
    if (!message) return;

    addUserMessage(message);
    pushHistory('user', message);

    void processQuery(message);
    elements.chatbotInput.value = '';
  });

  // Close chatbot
  elements.closeChat.addEventListener('click', closeChatbot);

  // Escape key to cancel request or close chatbot
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    
    if (state.inFlightAbort) {
      console.log('🛑 Cancelling request');
      state.inFlightAbort.abort('user_cancel');
    } else if (elements.chatbotPopup.classList.contains('active')) {
      closeChatbot();
    }
  });

  // Quick action buttons (if any are added to the UI)
  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('quick-action-btn')) return;

    const action = e.target.getAttribute('data-action') || '';
    addUserMessage(action);
    processQuery(action);
  });

  // Prevent docs button from triggering chatbot
  if (elements.docsBtn) {
    elements.docsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    console.log('🎬 Initializing chatbot');
    // Add welcome message
    addBotBubble(CONFIG.welcomeMessage);
    
    console.log('✅ Chatbot initialized successfully');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();