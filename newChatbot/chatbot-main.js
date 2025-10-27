/**
 * InsuranceChatbot - A chatbot for insurance website with semantic search
 */
// Detect embed mode via query param to suppress internal toggle when framed
const EMBED_MODE = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('embed');
    return v === '1' || v === 'true';
  } catch (e) {
    return false;
  }
})();

class InsuranceChatbot {
  constructor() {
    this.vectorStore = new SimpleVectorStore();
    this.scraper = new WebScraper();
    this.isOpen = false;
    this.isLoading = false;
    this.messages = [];
    this.websiteContent = [];
  }

  /**
   * Initialize the chatbot
   */
  async initialize() {
    try {
      // Create chatbot UI
      this.createChatbotUI();
      
      // Open and treat as embedded if embed param is present
      if (EMBED_MODE) {
        try {
          document.documentElement.classList.add('embedded');
          document.body.classList.add('embedded');
        } catch (e) {}
        this.toggleChatbot(true);
      }
      
      // Scrape website content
      this.isLoading = true;
      this.updateUI();
      
      await this.scrapeWebsiteContent();
      
      // Add welcome message with more detailed information
      this.addMessage("👋 Welcome to Insurance Assistant! I can help you with insurance quotes, policy information, and answer questions about our services. How can I assist you today?", 'bot');
      
      this.isLoading = false;
      this.updateUI();
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      this.logError('Initialization error', error);
      this.addMessage('Sorry, I had trouble loading. Please refresh the page or try again later. If the problem persists, please contact support.', 'bot');
      this.isLoading = false;
      this.updateUI();
    }
  }
  
  /**
   * Log errors for debugging
   * @param {string} context - Error context
   * @param {Error} error - Error object
   */
  logError(context, error) {
    console.error(`Chatbot Error [${context}]:`, error);
    // Could be extended to send errors to a logging service
  }

  // Escape HTML for safe rendering
  escapeHtml(s) {
    if (!s) return '';
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Render bot message with optional badge and citations
  renderBotHtml(msg) {
    const badge = msg.usingServer ? '<span class="chat-badge" style="background:#e8f3ff;color:#1f6feb;padding:2px 6px;border-radius:6px;font-size:12px;margin-right:6px;">Using server context</span><br/>' : '';
    const bodyHtml = this.formatTextWithParagraphsAndAnchors(msg.rawText || msg.text || '', msg.citations || []);
    return `${badge}${bodyHtml}`;
  }

  // Format streaming text: paragraphs and remove inline source markers like [#n]
  formatTextWithParagraphsAndAnchors(text, citations) {
    const safe = this.escapeHtml(text || '');
    // Remove bracketed citation lists like [#1, #2, #4] and single markers like [#1]
    const noRefs = safe
      .replace(/\s*\[[^\]]*#\d+[^\]]*\]\s*/g, ' ')
      .replace(/\s*\[#\d+\]\s*/g, ' ');
    // Convert newlines to paragraph/line breaks for readability
    let html = noRefs.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>');
    html = `<p>${html}</p>`;
    return html;
  }

  // Simple toast with optional retry button
  showToast(message, type = 'info', options = {}) {
    const toast = document.createElement('div');
    toast.className = 'chat-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = '#222';
    toast.style.color = '#fff';
    toast.style.padding = '10px 12px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    toast.style.zIndex = '9999';
    toast.style.fontSize = '13px';
    const color = type === 'error' ? '#b8000f' : (type === 'success' ? '#0f7b0f' : '#1f6feb');
    toast.style.border = `1px solid ${color}`;
    toast.textContent = message;
    if (options && typeof options.onRetry === 'function') {
      const btn = document.createElement('button');
      btn.textContent = options.retryLabel || 'Retry';
      btn.style.marginLeft = '8px';
      btn.style.background = '#fff';
      btn.style.color = '#000';
      btn.style.border = '1px solid #ccc';
      btn.style.borderRadius = '6px';
      btn.style.padding = '2px 8px';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', () => {
        try { options.onRetry(); } finally { if (document.body.contains(toast)) document.body.removeChild(toast); }
      });
      toast.appendChild(btn);
    }
    document.body.appendChild(toast);
    setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 4000);
  }

  // Helper to start SSE streaming for a message, reusable for retry
  startSSEForMessage(query, streamingMsg) {
    return new Promise((resolve, reject) => {
      const streamUrl = `http://localhost:8888/api/faiss/answer/stream?q=${encodeURIComponent(query)}&k=4`;
      const es = new EventSource(streamUrl);
      let closed = false;
    
      es.addEventListener('status', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.usingServerContext) {
            streamingMsg.usingServer = true;
            this.updateUI();
          }
        } catch {}
      });
    
      es.addEventListener('context', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data.citations)) {
            streamingMsg.citations = data.citations;
            this.updateUI();
          }
        } catch {}
      });
    
      es.addEventListener('token', (e) => {
        try {
          const data = JSON.parse(e.data);
          const t = data.text || '';
          streamingMsg.rawText += t;
          this.updateUI();
        } catch {}
      });
    
      es.addEventListener('done', () => {
        this.isLoading = false;
        this.updateUI();
        if (!closed) { closed = true; es.close(); }
        resolve(true);
      });
    
      es.addEventListener('error', () => {
        if (!closed) {
          closed = true;
          es.close();
          this.showToast('Streaming failed; falling back.', 'error', {
            retryLabel: 'Retry streaming',
            onRetry: () => {
              this.isLoading = true;
              this.updateUI();
              this.startSSEForMessage(query, streamingMsg).then(resolve).catch(() => {});
            }
          });
          reject(new Error('SSE failed'));
        }
      });
    });
  }

  /**
   * Create chatbot UI
   */
  createChatbotUI() {
    // Optional toggle when not embedded
    let toggleButton = null;
    if (!EMBED_MODE) {
      toggleButton = document.createElement('div');
      toggleButton.className = 'chatbot-toggle';
      toggleButton.innerHTML = '<i class="fas fa-comment"></i>';
      document.body.appendChild(toggleButton);
    }

    // Main container
    const chatbotContainer = document.createElement('div');
    chatbotContainer.className = 'chatbot-container';
    chatbotContainer.style.display = 'none';
    chatbotContainer.innerHTML = `
      <div class="chatbot-header">
        <h3>Insurance Assistant</h3>
        <button class="chatbot-close">&times;</button>
      </div>
      <div class="chatbot-messages"></div>
      <div class="chatbot-input-area">
        <input type="text" placeholder="Type your message...">
        <button class="chatbot-send">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    `;
    document.body.appendChild(chatbotContainer);

    this.elements = {
      toggleButton,
      chatbotContainer,
      messagesContainer: chatbotContainer.querySelector('.chatbot-messages'),
      inputArea: chatbotContainer.querySelector('.chatbot-input-area'),
      inputField: chatbotContainer.querySelector('.chatbot-input-area input'),
      sendButton: chatbotContainer.querySelector('.chatbot-send'),
      closeButton: chatbotContainer.querySelector('.chatbot-close')
    };

    this.addEventListeners();
  }

  /**
   * Wire UI interactions
   */
  addEventListeners() {
    const { toggleButton, chatbotContainer, closeButton, sendButton, inputField } = this.elements;

    if (toggleButton) {
      // Toggle chatbot visibility
      toggleButton.addEventListener('click', () => this.toggleChatbot());
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => this.toggleChatbot(false));
    }

    if (sendButton && inputField) {
      sendButton.addEventListener('click', () => this.handleUserInput(inputField));
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleUserInput(inputField);
      });
    }
  }

  /**
   * Handle user input
   */
  handleUserInput(inputField) {
    const message = inputField.value.trim();
    if (message) {
      this.processUserMessage(message);
      inputField.value = '';
    }
  }

  /**
   * Scrape website content to seed local fallback store
   */
  async scrapeWebsiteContent() {
    try {
      // Prefer main site content for richer docs
      this.websiteContent = await this.scraper.scrapeUrl('http://localhost:8888/');
      this.vectorStore.addDocuments(this.websiteContent);
    } catch (error) {
      this.logError('Scrape website', error);
      // Minimal fallback content
      this.websiteContent = [
        { text: 'SecureShield Insurance offers auto, home, health, and life insurance.', source: 'General' },
        { text: 'Get a quote by filling out our form or contacting an agent.', source: 'Contact' },
        { text: 'Our insurance services are tailored to your unique needs.', source: 'Services' }
      ];
      this.vectorStore.addDocuments(this.websiteContent);
    }
  }

  /**
   * Generate local response from vector store results
   */
  generateResponse(message, searchResults) {
    const m = (message || '').toLowerCase();

    if (m.includes('hello') || m.includes('hi') || m === 'hey') {
      return 'Hello! How can I help you with our insurance services today?';
    }

    if (m.includes('contact') || m.includes('reach') || m.includes('call')) {
      return 'You can contact us at (555) 123-4567 or email us at info@secureshield.com.';
    }

    if (m.includes('quote') || m.includes('price') || m.includes('cost')) {
      return 'We offer competitive quotes for all our insurance types. You can request a personalized quote by filling out the form on our website.';
    }

    if (m.includes('auto') || m.includes('car')) {
      return 'Our auto insurance provides comprehensive coverage for your vehicle, including liability, collision, and comprehensive options.';
    }

    if (m.includes('home') || m.includes('house') || m.includes('property')) {
      return 'Our home insurance protects your property and belongings against damage, theft, and liability. We offer customizable policies to fit your specific needs.';
    }

    if (m.includes('health')) {
      return 'Our health insurance plans provide coverage for medical expenses, prescriptions, and preventive care. We offer various plans to suit different needs and budgets.';
    }

    if (m.includes('life')) {
      return 'Our life insurance policies provide financial protection for your loved ones in case of your passing. We offer term life and whole life options.';
    }

    if (Array.isArray(searchResults) && searchResults.length > 0) {
      const top = searchResults[0];
      return `Based on what I know about ${top.document.source}: ${top.document.text}`;
    }

    return "I don't have specific information about that. Can you ask something about our insurance services?";
  }

  /**
   * Process user message
   * @param {string} message - User message
   */
  async processUserMessage(message) {
    // Add user message
    this.addMessage(message, 'user');
    // Show loading indicator
    this.isLoading = true;
    this.updateUI();
    try {
      // Prefer streaming answer via SSE
      let streamingMsg = { rawText: '', text: '', sender: 'bot', timestamp: new Date(), isHtml: true, usingServer: false, citations: [] };
      this.messages.push(streamingMsg);
      this.updateUI();
      try {
        await this.startSSEForMessage(message, streamingMsg);
      } catch (sseErr) {
        // Fallback to server JSON answer, then local
        try {
          const resp = await fetch('http://localhost:8888/api/faiss/answer', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: message, k: 4 })
          });
          if (resp.ok) {
            const data = await resp.json();
            const answer = data.answer || '';
            streamingMsg.rawText = answer;
            streamingMsg.usingServer = true;
            streamingMsg.citations = Array.isArray(data.citations) ? data.citations : [];
          } else {
            const searchResults = this.vectorStore.search(message, 3);
            const localResp = this.generateResponse(message, searchResults);
            streamingMsg.rawText = localResp;
            streamingMsg.usingServer = false;
            streamingMsg.citations = [];
          }
        } catch (netErr) {
          const searchResults = this.vectorStore.search(message, 3);
          const localResp = this.generateResponse(message, searchResults);
          streamingMsg.rawText = localResp;
          streamingMsg.usingServer = false;
          streamingMsg.citations = [];
        }
        this.isLoading = false;
        this.updateUI();
      }
    } catch (error) {
      this.logError('Process message', error);
      this.addMessage('Sorry, I encountered an error. Please try again or refresh the page if the problem persists.', 'bot');
      this.isLoading = false;
      this.updateUI();
    }
  }

  /**
   * Add message to chat
   * @param {string} text - Message text
   * @param {string} sender - Message sender ('user' or 'bot')
   */
  addMessage(text, sender) {
    // Create message object
    const message = {
      text,
      sender,
      timestamp: new Date()
    };
    
    // Add to messages array
    this.messages.push(message);
    
    // Update UI
    this.updateUI();
    
    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Update UI
   */
  updateUI() {
    const { chatbotContainer, messagesContainer } = this.elements;
    
    // Update visibility
    chatbotContainer.style.display = this.isOpen ? 'flex' : 'none';
    
    // Update messages
    messagesContainer.innerHTML = '';
    
    // Add messages with animation for visibility
    this.messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = `chatbot-message ${message.sender}-message`;
      if (message.sender === 'bot' && message.isHtml) {
        messageElement.innerHTML = this.renderBotHtml(message);
      } else {
        messageElement.textContent = message.text;
      }
      messagesContainer.appendChild(messageElement);
      // Ensure message is visible by applying animation class
      setTimeout(() => {
        messageElement.classList.add('animated');
      }, 10);
    });
    
    // Show loading indicator if needed
    if (this.isLoading) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'chatbot-message bot-message';
      loadingElement.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
      messagesContainer.appendChild(loadingElement);
      setTimeout(() => {
        loadingElement.classList.add('animated');
      }, 10);
    }
  }

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    const { messagesContainer } = this.elements;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Toggle chatbot visibility
   * @param {boolean} [show] - Force show/hide
   */
  toggleChatbot(show) {
    this.isOpen = show !== undefined ? show : !this.isOpen;
    this.updateUI();
    
    // Focus input field when opened
    if (this.isOpen) {
      setTimeout(() => {
        this.elements.inputField.focus();
      }, 100);
    }
  }
}

// Initialize the chatbot when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  const chatbot = new InsuranceChatbot();
  chatbot.initialize();
});