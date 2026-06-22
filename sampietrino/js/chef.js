/* =========================================================
   SAMPIETRINO — chef.js
   AI Chef Remo chat interface
   ========================================================= */

(function () {
  'use strict';

  var API_URL = 'https://sampietrinonl.netlify.app/api/chef';
  var messages = []; // conversation history sent to API
  var isLoading = false;

  // The initial greeting is already rendered in HTML — we don't
  // add it to messages[] so it doesn't inflate the context, but
  // we do prime the assistant side with a short system confirmation.

  /* ── DOM references ───────────────────────────────────── */
  var form        = document.getElementById('chat-form');
  var input       = document.getElementById('chat-input');
  var sendBtn     = document.getElementById('chat-send');
  var messagesEl  = document.getElementById('chat-messages');
  var chatArea    = document.getElementById('chat-area');
  var statusEl    = document.getElementById('chef-status');

  if (!form || !input || !messagesEl) return; // guard: only run on chef page

  /* ── Helpers ──────────────────────────────────────────── */

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Very light Markdown: **bold**, *italic*, newlines → <br>
  function renderText(str) {
    var escaped = escapeHtml(str);
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  }

  function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function setLoading(loading) {
    isLoading = loading;
    sendBtn.disabled = loading;
    input.disabled = loading;
    if (statusEl) {
      statusEl.innerHTML = loading
        ? '<span class="chef-topbar__dot" aria-hidden="true" style="background:#C9A96E"></span><span>Writing...</span>'
        : '<span class="chef-topbar__dot" aria-hidden="true"></span><span>Online</span>';
    }
  }

  /* ── Render message ───────────────────────────────────── */

  function appendMessage(role, text, opts) {
    opts = opts || {};
    var article = document.createElement('article');
    article.className = 'message message--' + (role === 'assistant' ? 'chef' : 'user');
    if (opts.error) article.classList.add('message--error');
    article.setAttribute('role', 'article');
    article.setAttribute('aria-label', role === 'assistant' ? 'Message from Chef Remo' : 'Your message');

    var sender = document.createElement('span');
    sender.className = 'message__sender';
    sender.textContent = role === 'assistant' ? 'Chef Remo' : 'You';

    var bubble = document.createElement('div');
    bubble.className = 'message__bubble';
    bubble.innerHTML = renderText(text);

    article.appendChild(sender);
    article.appendChild(bubble);
    messagesEl.appendChild(article);
    scrollToBottom();
    return article;
  }

  /* ── Loading indicator ────────────────────────────────── */

  function appendLoadingDots() {
    var article = document.createElement('article');
    article.className = 'message message--chef';
    article.id = 'loading-indicator';
    article.setAttribute('aria-label', 'Chef Remo is writing');
    article.setAttribute('aria-live', 'polite');

    var sender = document.createElement('span');
    sender.className = 'message__sender';
    sender.textContent = 'Chef Remo';

    var loading = document.createElement('div');
    loading.className = 'message__loading';
    loading.setAttribute('aria-hidden', 'true');
    loading.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

    article.appendChild(sender);
    article.appendChild(loading);
    messagesEl.appendChild(article);
    scrollToBottom();
    return article;
  }

  function removeLoadingDots() {
    var indicator = document.getElementById('loading-indicator');
    if (indicator) indicator.remove();
  }

  /* ── Auto-resize textarea ─────────────────────────────── */

  input.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 140) + 'px';
  });

  // Submit on Enter (no shift)
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) form.dispatchEvent(new Event('submit'));
    }
  });

  /* ── Send message ─────────────────────────────────────── */

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (isLoading) return;

    var text = input.value.trim();
    if (!text) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Render user message
    appendMessage('user', text);

    // Add to history
    messages.push({ role: 'user', content: text });

    // Send to backend
    sendToChef();
  });

  /* ── API call ─────────────────────────────────────────── */

  function sendToChef() {
    setLoading(true);
    var loadingEl = appendLoadingDots();

    // Build payload — send full history for context
    var payload = JSON.stringify({ messages: messages });

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            throw new Error(body.error || 'HTTP ' + res.status);
          });
        }
        return res.json();
      })
      .then(function (data) {
        removeLoadingDots();
        var reply = (data && data.reply) ? data.reply : 'I didn\'t quite catch that. Could you rephrase?';
        appendMessage('assistant', reply);
        messages.push({ role: 'assistant', content: reply });
      })
      .catch(function (err) {
        removeLoadingDots();
        var errMsg = 'Sorry, I had a connection issue. Please try again in a moment.';
        appendMessage('assistant', errMsg, { error: true });
        console.error('[Chef Remo]', err);
      })
      .finally(function () {
        setLoading(false);
        input.focus();
      });
  }

  /* ── Init ─────────────────────────────────────────────── */
  input.focus();
  scrollToBottom();

})();
