(function() {
  'use strict';

  var GA_ID = 'G-CNF86BSG95';
  var STORAGE_KEY = 'cookieConsent';

  function loadGA() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function hideBar(bar) {
    bar.style.transform = 'translateY(100%)';
    setTimeout(function() {
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    }, 400);
  }

  function showConsentBar() {
    var style = document.createElement('style');
    style.textContent = [
      '#cc-bar{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#0d1117;border-top:1px solid #30363d;padding:16px 20px;font-family:"Inter","Segoe UI",sans-serif;color:#e6edf3;transform:translateY(100%);animation:cc-slide .4s cubic-bezier(.4,0,.2,1) forwards;box-shadow:0 -4px 24px rgba(0,0,0,.5)}',
      '@keyframes cc-slide{to{transform:translateY(0)}}',
      '#cc-bar *{box-sizing:border-box}',
      '.cc-inner{max-width:960px;margin:0 auto;display:flex;align-items:center;gap:16px;flex-wrap:wrap}',
      '.cc-text{flex:1;min-width:200px;font-size:13px;line-height:1.5;color:#8b949e}',
      '.cc-text a{color:#569cd6;text-decoration:none}',
      '.cc-text a:hover{text-decoration:underline}',
      '.cc-btns{display:flex;gap:10px;flex-shrink:0}',
      '.cc-btn{border:none;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .2s}',
      '.cc-btn:hover{opacity:.85}',
      '.cc-accept{background:#7c3aed;color:#fff}',
      '.cc-decline{background:transparent;color:#8b949e;border:1px solid #30363d}',
      '@media(max-width:480px){.cc-inner{flex-direction:column;text-align:center}.cc-btns{width:100%;justify-content:center}}'
    ].join('');
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'cc-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.innerHTML = '<div class="cc-inner">'
      + '<div class="cc-text">This site uses cookies for analytics. See our <a href="/privacy-policy.html">Privacy Policy</a> for details.</div>'
      + '<div class="cc-btns">'
      + '<button class="cc-btn cc-decline" id="cc-decline">Decline</button>'
      + '<button class="cc-btn cc-accept" id="cc-accept">Accept</button>'
      + '</div></div>';
    document.body.appendChild(bar);

    document.getElementById('cc-accept').addEventListener('click', function() {
      try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch (e) {}
      loadGA();
      hideBar(bar);
    });

    document.getElementById('cc-decline').addEventListener('click', function() {
      try { localStorage.setItem(STORAGE_KEY, 'declined'); } catch (e) {}
      hideBar(bar);
    });
  }

  window.__resetCookieConsent = function() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    location.reload();
  };

  var consent;
  try { consent = localStorage.getItem(STORAGE_KEY); } catch (e) { consent = null; }

  if (consent === 'accepted') {
    loadGA();
  } else if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showConsentBar);
    } else {
      showConsentBar();
    }
  }
})();
