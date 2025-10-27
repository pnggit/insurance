// Chatbot Widget Integration (8888 -> 8889)
(function() {
  function log(ctx, msg, err) {
    const prefix = `[ChatbotWidget] ${ctx}:`;
    if (err) console.error(prefix, msg, err);
    else console.log(prefix, msg);
  }

  function createWidget() {
    // Toggle button
    const toggle = document.createElement('button');
    toggle.className = 'chatbot-widget-toggle';
    toggle.setAttribute('aria-label', 'Open chat');
    toggle.title = 'Chat with us';
    toggle.innerHTML = '<i class="fas fa-comment"></i>';

    // Container
    const container = document.createElement('div');
    container.className = 'chatbot-widget-container';
    container.setAttribute('aria-hidden', 'true');

    // Header
    const header = document.createElement('div');
    header.className = 'chatbot-widget-header';
    header.innerHTML = `
      <span class="chatbot-widget-header-title">Insurance Assistant</span>
      <button class="chatbot-widget-close" aria-label="Close">&times;</button>
    `;

    // Iframe to 8889 chatbot app
    const frame = document.createElement('iframe');
    frame.className = 'chatbot-widget-frame';
    frame.src = 'http://localhost:8889/';
    frame.title = 'Insurance Chatbot';
    frame.loading = 'eager';

    // Status text (optional)
    const status = document.createElement('div');
    status.className = 'chatbot-widget-status';
    status.textContent = 'Connecting to chatbot…';

    container.appendChild(header);
    container.appendChild(frame);
    container.appendChild(status);
    document.body.appendChild(toggle);
    document.body.appendChild(container);

    // Behavior
    function setOpen(open) {
      container.style.display = open ? 'block' : 'none';
      container.setAttribute('aria-hidden', String(!open));
      if (open) frame.focus();
    }

    // Toggle open/close
    toggle.addEventListener('click', () => {
      const isOpen = container.style.display === 'block';
      setOpen(!isOpen);
    });

    const closeBtn = header.querySelector('.chatbot-widget-close');
    closeBtn.addEventListener('click', () => setOpen(false));

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Iframe load handling
    let loadTimeout = setTimeout(() => {
      status.textContent = 'Chatbot seems slow to respond. You can open it directly if needed.';
      status.innerHTML += ' <a href="http://localhost:8889/" target="_blank" rel="noopener">Open full chat</a>';
    }, 6000);

    frame.addEventListener('load', () => {
      clearTimeout(loadTimeout);
      status.textContent = 'Connected';
      setTimeout(() => { status.style.display = 'none'; }, 1500);
    });

    frame.addEventListener('error', (err) => {
      clearTimeout(loadTimeout);
      status.textContent = 'Unable to load chatbot. Please open in a new tab.';
      status.innerHTML += ' <a href="http://localhost:8889/" target="_blank" rel="noopener">Open full chat</a>';
      log('iframe', 'load error', err);
    });

    // Optional: postMessage bridge hooks (reserved for future)
    // window.addEventListener('message', (ev) => {
    //   // Validate origin if needed
    //   // if (ev.origin !== 'http://localhost:8889') return;
    //   // Handle messages from chatbot app
    //   // log('postMessage', 'received', ev.data);
    // });

    // Expose minimal API for debugging
    window.ChatbotWidget = {
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => {
        const isOpen = container.style.display === 'block';
        setOpen(!isOpen);
      }
    };

    log('init', 'Widget created');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();