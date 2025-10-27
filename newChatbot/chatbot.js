/**
 * InsuranceChatbot - A chatbot for insurance website with semantic search
 */
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
      
      // Add welcome message
      this.addMessage("Hello! I'm your insurance assistant. How can I help you today?", 'bot');
      
      this.isLoading = false;
      this.updateUI();
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      this.addMessage('Sorry, I had trouble loading. Please try again later.', 'bot');
      this.isLoading = false;
      this.updateUI();
    }
  }

  /**
   * Create chatbot UI
   */
  createChatbotUI() {
    // Create toggle button
    const toggleButton = document.createElement('div');
    toggleButton.className = 'chatbot-toggle';
    toggleButton.innerHTML = '<i class="fas fa-comment"></i>';
    document.body.appendChild(toggleButton);

    // Create chatbot container
    const chatbotContainer = document.createElement('div');
    chatbotContainer.className = 'chatbot-container';
    chatbotContainer.style.display = 'none'; // Initially hidden
    
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
    
    // Add event listeners
    this.addEventListeners();
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    const toggleButton = document.querySelector('.chatbot-toggle');
    const chatbotContainer = document.querySelector('.chatbot-container');
    const closeButton = document.querySelector('.chatbot-close');
    const sendButton = document.querySelector('.chatbot-send');
    const inputField = document.querySelector('.chatbot-input-area input');

    // Toggle chatbot visibility
    toggleButton.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      chatbotContainer.style.display = this.isOpen ? 'flex' : 'none';
      if (this.isOpen) {
        inputField.focus();
      }
    });

    // Close chatbot
    closeButton.addEventListener('click', () => {
      this.isOpen = false;
      chatbotContainer.style.display = 'none';
    });

    // Send message on button click
    sendButton.addEventListener('click', () => {
      this.handleUserInput(inputField);
    });

    // Send message on Enter key
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleUserInput(inputField);
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
      // Scrape content from the website
      this.websiteContent = await this.scraper.scrapeUrl('http://localhost:8888/');
      
      // Add documents to vector store
      this.vectorStore.addDocuments(this.websiteContent);
      
      console.log(`Added ${this.websiteContent.length} documents to vector store`);
    } catch (error) {
      console.error('Error scraping website content:', error);
      // Fallback content
      this.websiteContent = [
        { text: 'SecureShield Insurance offers auto, home, health, and life insurance.', source: 'General' },
        { text: 'Get a quote by filling out our form or contacting an agent.', source: 'Contact' },
        { text: 'Our insurance services are tailored to your unique needs.', source: 'Services' }
      ];
      this.vectorStore.addDocuments(this.websiteContent);
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
      console.error('Error processing message:', error);
      this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
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
    
    // Check for greetings
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower === 'hey') {
      return "Hello! How can I help you with our insurance services today?";
    }
    
    // Check for common questions
    if (messageLower.includes('contact') || messageLower.includes('reach') || messageLower.includes('call')) {
      return "You can contact us at (555) 123-4567 or email us at info@secureshield.com.";
    }
    
    if (messageLower.includes('quote') || messageLower.includes('price') || messageLower.includes('cost')) {
      return "We offer competitive quotes for all our insurance types. You can request a personalized quote by filling out the form on our website.";
    }
    
    // Check for insurance types
    if (messageLower.includes('auto') || messageLower.includes('car')) {
      return "Our auto insurance provides comprehensive coverage for your vehicle, including liability, collision, and comprehensive options.";
    }
    
    if (messageLower.includes('home') || messageLower.includes('house') || messageLower.includes('property')) {
      return "Our home insurance protects your property and belongings against damage, theft, and liability. We offer customizable policies to fit your specific needs.";
    }
    
    if (messageLower.includes('health')) {
      return "Our health insurance plans provide coverage for medical expenses, prescriptions, and preventive care. We offer various plans to suit different needs and budgets.";
    }
    
    if (messageLower.includes('life')) {
      return "Our life insurance policies provide financial protection for your loved ones in case of your passing. We offer term life and whole life options.";
    }
    
    // Use search results if available
    if (searchResults.length > 0) {
      const topResult = searchResults[0];
      return `Based on what I know about ${topResult.document.source}: ${topResult.document.text}`;
    }
    
    // Default response
    return "I don't have specific information about that. Can you ask something about our insurance services?";
  }

  /**
   * Add message to chat
   * @param {string} text - Message text
   * @param {string} sender - Message sender ('user' or 'bot')
   */
  addMessage(text, sender) {
    const timestamp = new Date();
    
    // Add to messages array
    this.messages.push({
      text,
      sender,
      timestamp
    });
    
    // Update UI
    const messagesContainer = document.querySelector('.chatbot-messages');
    if (messagesContainer) {
      const messageElement = document.createElement('div');
      messageElement.className = `chatbot-message ${sender}-message`;
      
      // Add timestamp
      const timeString = this.formatTime(timestamp);
      
      messageElement.innerHTML = `
        <div class="message-content">${text}</div>
        <div class="message-time">${timeString}</div>
      `;
      
      messagesContainer.appendChild(messageElement);
      
      // Add animation class
      setTimeout(() => {
        messageElement.classList.add('animated');
      }, 10);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Update UI
   */
  updateUI() {
    const messagesContainer = document.querySelector('.chatbot-messages');
    
    // Add or remove typing indicator
    const existingIndicator = document.querySelector('.typing-indicator');
    
    if (this.isLoading) {
      if (!existingIndicator) {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } else if (existingIndicator) {
      existingIndicator.remove();
    }
  }

  /**
   * Format time
   * @param {Date} date - Date object
   * @returns {string} - Formatted time string
   */
  formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new InsuranceChatbot();
  window.chatbot.initialize();
});