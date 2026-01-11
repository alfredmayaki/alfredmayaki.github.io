// JavaScript source code
(function () {
  'use strict';

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

  // Early exit if critical elements are missing
  if (!elements.searchInput || !elements.searchBtn || !elements.chatbotPopup || 
      !elements.chatbotMessages || !elements.chatbotInput || !elements.closeChat) {
    console.error('Critical chatbot elements not found');
    return;
  }

  // ========================================
  // CONFIGURATION
  // ========================================
  const CONFIG = {
    chatApiUrl: 'https://shy-sea-600a.alfred-mayaki.workers.dev/chat',
    maxMessageChars: 1000,
    requestTimeoutMs: 30000,
    maxHistoryTurns: 6,
    welcomeMessage: '👋 Hello! I\'m powered by Google Gemini. Ask me anything about Alfred Mayaki or any topic you\'d like to explore.'
  };

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
      console.log('Particles.js loaded');
    });
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
    const query = elements.searchInput.value.trim();
    elements.chatbotPopup.classList.add('active');

    if (!query) {
      elements.chatbotInput.focus();
      return;
    }

    addUserMessage(query);
    processQuery(query);
    elements.searchInput.value = '';
  }

  function closeChatbot() {
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

    if (text.length > CONFIG.maxMessageChars) {
      addBotBubble(`Message too long. Please keep it under ${CONFIG.maxMessageChars} characters.`);
      return;
    }

    if (state.isSending) {
      return;
    }

    state.isSending = true;
    setInputEnabled(false);

    const bubble = addBotBubble('Thinking...');

    const controller = new AbortController();
    state.inFlightAbort = controller;

    const timeoutId = setTimeout(() => {
      controller.abort('timeout');
    }, CONFIG.requestTimeoutMs);

    try {
      const payload = {
        message: text,
        stream: false,
        history: state.conversationHistory
      };

      const response = await fetch(CONFIG.chatApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const raw = await response.text().catch(() => '');
      
      if (!response.ok) {
        bubble.textContent = `Server error: ${response.status}. Please check your chat API endpoint configuration.`;
        return;
      }

      let data;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (parseError) {
        bubble.textContent = 'Invalid response from server. Please verify your backend setup.';
        return;
      }

      const reply = String(data?.reply || '').trim();
      bubble.textContent = reply || '(empty reply)';
      pushHistory('bot', bubble.textContent);
      
    } catch (error) {
      if (String(error?.name) === 'AbortError') {
        bubble.textContent = 'Request timed out. Please try again.';
      } else {
        bubble.textContent = `Network error: ${String(error?.message || error)}. Is your chat API endpoint configured?`;
      }
    } finally {
      clearTimeout(timeoutId);
      state.inFlightAbort = null;
      state.isSending = false;
      setInputEnabled(true);
      elements.chatbotInput.focus();
      scrollToBottom();
    }
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================

  // Search button and input
  elements.searchBtn.addEventListener('click', function () {
    void tryAutoplayMusic();
    openChatbot();
  });

  elements.searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      void tryAutoplayMusic();
      openChatbot();
    }
  });

  // Chatbot input
  elements.chatbotInput.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

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
    // Add welcome message
    addBotBubble(CONFIG.welcomeMessage);
    
    console.log('Chatbot initialized successfully');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
