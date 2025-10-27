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

  /**
   * Create chatbot UI
   */
  createChatbotUI() {
    // Prevent duplicate UI injection if already present
    if (document.querySelector('.chatbot-container')) { return; }

    // Create toggle button; hide it in embed mode
    const toggleButton = document.createElement('div');
    toggleButton.className = 'chatbot-toggle';
    toggleButton.innerHTML = '<i class="fas fa-comment"></i>';
    if (EMBED_MODE) {
      toggleButton.style.display = 'none';
      // In embed mode, show the chat by default
      this.isOpen = true;
      // Mark body/html as embedded to hide page content and disable scrollbars
      document.body.classList.add('embedded');
      document.documentElement.classList.add('embedded');
    }
    document.body.appendChild(toggleButton);

    // Create chatbot container
    const chatbotContainer = document.createElement('div');
    chatbotContainer.className = 'chatbot-container';
    chatbotContainer.style.display = EMBED_MODE ? 'flex' : 'none';
    document.body.appendChild(chatbotContainer);

    // Create chatbot header
    const chatbotHeader = document.createElement('div');
    chatbotHeader.className = 'chatbot-header';
    chatbotHeader.innerHTML = `
      <h3>Insurance Assistant</h3>
      <button class="chatbot-close">&times;</button>
    `;
    chatbotContainer.appendChild(chatbotHeader);

    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'chatbot-messages';
    chatbotContainer.appendChild(messagesContainer);

    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chatbot-input-area';
    inputContainer.innerHTML = `
      <input type="text" placeholder="Type your question here...">
      <button class="chatbot-send">
        <i class="fas fa-paper-plane"></i>
      </button>
    `;
    chatbotContainer.appendChild(inputContainer);

    // Store references to DOM elements
    this.elements = {
      toggleButton,
      chatbotContainer,
      messagesContainer,
      inputField: inputContainer.querySelector('input'),
      sendButton: inputContainer.querySelector('.chatbot-send'),
      closeButton: chatbotHeader.querySelector('.chatbot-close')
    };

    // Add event listeners
    this.addEventListeners();
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    const { toggleButton, closeButton, inputField, sendButton } = this.elements;
    
    // Ensure proper event handling with error catching
    
    // Toggle chatbot visibility with improved error handling
    toggleButton.addEventListener('click', () => {
      try {
        this.toggleChatbot();
      } catch (error) {
        this.logError('Toggle chatbot', error);
      }
    });

    // Close chatbot
    closeButton.addEventListener('click', () => {
      try {
        this.toggleChatbot(false);
      } catch (error) {
        this.logError('Close chatbot', error);
      }
    });

    // Send message on button click with improved handling
    sendButton.addEventListener('click', () => {
      try {
        this.handleUserInput(inputField);
      } catch (error) {
        this.logError('Send button click', error);
        this.addMessage('Sorry, I encountered an error processing your request. Please try again.', 'bot');
      }
    });

    // Send message on Enter key with improved handling
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        try {
          this.handleUserInput(inputField);
        } catch (error) {
          this.logError('Enter key press', error);
          this.addMessage('Sorry, I encountered an error processing your request. Please try again.', 'bot');
        }
      }
    });
    
    // Add focus to input field when chatbot opens
    this.elements.chatbotContainer.addEventListener('transitionend', () => {
      if (this.isOpen) {
        this.elements.inputField.focus();
      }
    });
  }

  /**
   * Handle user input
   * @param {HTMLInputElement} inputField - Input field element
   */
  handleUserInput(inputField) {
    const message = inputField.value.trim();
    if (message) {
      this.processUserMessage(message);
      inputField.value = '';
    }
  }

  /**
   * Scrape website content
   */
  async scrapeWebsiteContent() {
    try {
      const origin = window.location.origin;
      console.log(`Scraping content from: ${origin}`);

      // Prefer server API on 8888 if available to avoid heavy client-side parsing
      try {
        const apiResponse = await fetch('http://localhost:8888/api/scrape-content', { mode: 'cors' });
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (Array.isArray(apiData) && apiData.length) {
            this.websiteContent = apiData;
            this.vectorStore.addDocuments(this.websiteContent);
            console.log(`Loaded ${this.websiteContent.length} documents via API`);
            return; // Done
          }
        }
      } catch (apiError) {
        this.logError('Content scraping API', apiError);
      }

      // Fallback: client-side scrape current origin
      this.websiteContent = await this.scraper.scrapeUrl(origin);
      this.vectorStore.addDocuments(this.websiteContent);
      console.log(`Added ${this.websiteContent.length} documents to vector store`);
    } catch (error) {
      this.logError('Content scraping', error);
      console.error('Error scraping website content:', error);
      this.websiteContent = [
        { text: 'SecureShield Insurance offers auto, home, health, and life insurance.', source: 'General' },
        { text: 'Get a quote by filling out our form or contacting an agent.', source: 'Contact' },
        { text: 'Our insurance services are tailored to your unique needs.', source: 'Services' }
      ];
      this.vectorStore.addDocuments(this.websiteContent);
      if (this.messages.length === 0) {
        this.addMessage("I'm having trouble accessing the latest information. I'll do my best to assist you with general insurance questions.", 'bot');
      }
    }
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
      // Search for relevant content
      const searchResults = this.vectorStore.search(message, 3);
      
      // Generate response
      const response = this.generateResponse(message, searchResults);
      
      // Add bot response
      setTimeout(() => {
        this.addMessage(response, 'bot');
        this.isLoading = false;
        this.updateUI();
      }, 500); // Small delay for natural feel
    } catch (error) {
      this.logError('Process message', error);
      this.addMessage('Sorry, I encountered an error. Please try again or refresh the page if the problem persists.', 'bot');
      this.isLoading = false;
      this.updateUI();
    }
  }

  /**
   * Generate response based on user message and search results
   * @param {string} message - User message
   * @param {Array} searchResults - Search results
   * @returns {string} - Bot response
   */
  generateResponse(message, searchResults) {
    const messageLower = message.toLowerCase();

    // Light greeting, then rely on scraped content
    if (/^(hi|hello|hey)\b/.test(messageLower)) {
      return "Hello! Ask me anything about our services — I’ll answer using the website content.";
    }

    // Use search results if available (answers derived from scraped site)
    if (searchResults && searchResults.length > 0) {
      const topDoc = searchResults[0].document;
      const secondary = searchResults[1]?.document;

      let answer = topDoc.text;
      // Provide a short supporting snippet if available
      if (secondary && secondary.text && secondary.text !== topDoc.text) {
        answer += `\n\nRelated info: ${secondary.text}`;
      }

      // Add lightweight citation of source
      const src = topDoc.source ? ` (source: ${topDoc.source})` : '';
      return `${answer}${src}`;
    }

    // Default when no match is found in the site
    return "I couldn’t find matching information in the website. Try rephrasing or asking about specific policies, coverage, quotes, or contact information.";
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
      messageElement.textContent = message.text;
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