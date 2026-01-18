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
    chatApiUrl: 'https://alfredmayaki.me/chat',
    maxMessageChars: 4000,
    requestTimeoutMs: 30000,
    maxHistoryTurns: 10,
    maxFileSize: 1 * 1024 * 1024, // Reduced to 1MB
    welcomeMessage: '👋🏿🌍🚀 Hello! I\'m powered by Claude Opus 4.5. Ask me anything on any topic you\'d like to explore. You can also upload documents (.txt, .md, .json, .csv, .pdf, .docx) for analysis!',
    soundEffects: {
      enabled: true,        
      volume: 0.4
    }
  };

  console.log('⚙️ Config:', CONFIG);

  // ========================================
  // SOUND EFFECTS SYSTEM
  // ========================================
  const SoundFX = {
    audioContext: null,
    isInitialized: false,
    
    init() {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isInitialized = true;
        console.log('🔊 Sound effects initialized');
      } catch (error) {
        console.warn('⚠️ Web Audio API not supported:', error);
      }
    },

    async resume() {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log('🔊 Audio context resumed');
        } catch (error) {
          console.warn('⚠️ Could not resume audio context:', error);
        }
      }
    },

    async playClick() {
      if (!CONFIG.soundEffects.enabled || !this.audioContext) return;
      await this.resume();
      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(CONFIG.soundEffects.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
      } catch (error) {
        console.warn('⚠️ Error playing click sound:', error);
      }
    },

    async playScroll() {
      if (!CONFIG.soundEffects.enabled || !this.audioContext) return;
      await this.resume();
      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 400;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(CONFIG.soundEffects.volume * 0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
      } catch (error) {
        console.warn('⚠️ Error playing scroll sound:', error);
      }
    },

    async playHover() {
      if (!CONFIG.soundEffects.enabled || !this.audioContext) return;
      await this.resume();
      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(CONFIG.soundEffects.volume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.03);
      } catch (error) {
        console.warn('⚠️ Error playing hover sound:', error);
      }
    },

    async playSuccess() {
      if (!CONFIG.soundEffects.enabled || !this.audioContext) return;
      await this.resume();
      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(CONFIG.soundEffects.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
      } catch (error) {
        console.warn('⚠️ Error playing success sound:', error);
      }
    }
  };

  SoundFX.init();

  const unlockAudio = async function() {
    await SoundFX.resume();
    console.log('🔊 Audio unlocked');
  };

  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });

  // ========================================
  // SCROLL SOUND EFFECT
  // ========================================
  let scrollTimeout;
  let lastScrollTime = 0;
  const scrollThrottle = 150;

  window.addEventListener('scroll', function() {
    const now = Date.now();
    if (now - lastScrollTime > scrollThrottle) {
      void SoundFX.playScroll();
      lastScrollTime = now;
    }
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {}, 150);
  }, { passive: true });

  if (elements.chatbotMessages) {
    elements.chatbotMessages.addEventListener('scroll', function() {
      const now = Date.now();
      if (now - lastScrollTime > scrollThrottle) {
        void SoundFX.playScroll();
        lastScrollTime = now;
      }
    }, { passive: true });
  }

  // ========================================
  // CLICK SOUND EFFECTS
  // ========================================
  document.addEventListener('click', function(e) {
    if (e.target.matches('button, a, select, input[type="button"], input[type="submit"], .search-btn, .docs-btn, .footer-link, .button-link')) {
      void SoundFX.playClick();
    }
  }, true);

  // ========================================
  // HOVER SOUND EFFECTS
  // ========================================
  const interactiveSelectors = 'button, a, select, .search-btn, .docs-btn, .footer-link, .button-link, option';
  let lastHoverTime = 0;
  const hoverThrottle = 100;

  document.addEventListener('mouseover', function(e) {
    const now = Date.now();
    if (e.target.matches(interactiveSelectors) && now - lastHoverTime > hoverThrottle) {
      void SoundFX.playHover();
      lastHoverTime = now;
    }
  }, true);

  document.addEventListener('focus', function(e) {
    if (e.target.matches('select')) {
      void SoundFX.playHover();
    }
  }, true);

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const state = {
    isSending: false,
    inFlightAbort: null,
    conversationHistory: [],
    uploadedFile: null
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
  // ========================================
  // CHATBOT UI FUNCTIONS
  // ========================================
  function openChatbot() {
    console.log('💬 Opening chatbot');
    const query = elements.searchInput.value.trim();
    elements.chatbotPopup.classList.add('active');
    void SoundFX.playSuccess();

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
    void SoundFX.playClick();
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

  function addFileUploadUI() {
    const uploadArea = document.createElement('div');
    uploadArea.className = 'file-upload-area';
    uploadArea.innerHTML = `
      <input type="file" id="fileUpload" accept=".txt,.md,.json,.csv,.log,.pdf,.docx" style="display: none;">
      <button class="upload-btn" id="uploadBtn">
        📎 Upload Document
      </button>
      <span id="fileName" style="display: none; margin-left: 10px; color: var(--text-muted); font-size: 0.9em;"></span>
    `;
    
    const inputArea = elements.chatbotPopup.querySelector('.chatbot-input-area');
    inputArea.insertBefore(uploadArea, inputArea.firstChild);

    const fileInput = document.getElementById('fileUpload');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileNameSpan = document.getElementById('fileName');

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > CONFIG.maxFileSize) {
          alert('File too large! Maximum size is 1MB.');
          fileInput.value = '';
          return;
        }
        state.uploadedFile = file;
        fileNameSpan.textContent = `📄 ${file.name}`;
        fileNameSpan.style.display = 'inline';
        console.log('File selected:', file.name);
      }
    });
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

    const bubble = addBotBubble('🧑🏿‍💻💭');

    const controller = new AbortController();
    state.inFlightAbort = controller;

    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Request timeout');
      controller.abort('timeout');
    }, CONFIG.requestTimeoutMs);

    try {
      let response;

      if (state.uploadedFile) {
        // Send with file
        const formData = new FormData();
        formData.append('message', text);
        formData.append('file', state.uploadedFile);
        formData.append('history', JSON.stringify(state.conversationHistory));

        console.log('📡 Sending request with file:', state.uploadedFile.name);

        response = await fetch(CONFIG.chatApiUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        // Clear uploaded file after sending
        state.uploadedFile = null;
        const fileNameSpan = document.getElementById('fileName');
        if (fileNameSpan) fileNameSpan.style.display = 'none';
        document.getElementById('fileUpload').value = '';
      } else {
        // Send regular JSON
        const payload = {
          message: text,
          stream: false,
          history: state.conversationHistory
        };

        console.log('📡 Sending request to:', CONFIG.chatApiUrl);
        console.log('📦 Payload:', payload);

        response = await fetch(CONFIG.chatApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      }

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
      void SoundFX.playSuccess();
      
    } catch (error) {
      console.error('❌ Fetch error:', error);
      console.error('Error name:', error?.name);
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

  elements.searchBtn.addEventListener('click', function () {
    console.log('🔍 Search button clicked');
    openChatbot();
  });

  elements.searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      console.log('⏎ Enter pressed in search input');
      openChatbot();
    }
  });

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

  elements.closeChat.addEventListener('click', closeChatbot);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    
    if (state.inFlightAbort) {
      console.log('🛑 Cancelling request');
      state.inFlightAbort.abort('user_cancel');
    } else if (elements.chatbotPopup.classList.contains('active')) {
      closeChatbot();
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.classList.contains('quick-action-btn')) return;
    const action = e.target.getAttribute('data-action') || '';
    addUserMessage(action);
    processQuery(action);
  });

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
    addBotBubble(CONFIG.welcomeMessage);
    addFileUploadUI();
    console.log('✅ Chatbot initialized successfully');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();