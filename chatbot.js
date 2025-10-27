// Chatbot implementation with direct message handling
class InsuranceChatbot {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.messages = [];
    this.websiteContent = [
      { text: 'SecureShield Insurance offers auto, home, health, and life insurance.', source: 'General' },
      { text: 'Get a quote by filling out our form or contacting an agent.', source: 'Contact' },
      { text: 'Our insurance services are tailored to your unique needs.', source: 'Services' },
      { text: 'Auto insurance covers liability, collision, and comprehensive options.', source: 'Auto' },
      { text: 'Home insurance protects your property and belongings against damage and theft.', source: 'Home' },
      { text: 'Health insurance covers medical expenses, prescriptions, and preventive care.', source: 'Health' },
      { text: 'Life insurance provides financial protection for your loved ones.', source: 'Life' }
    ];
  }

  // Initialize the chatbot
  initialize() {
    // Create UI elements
    this.createUI();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Add welcome message immediately and ensure it's displayed
    this.addMessage("Welcome to SecureShield Insurance Assistant! I'm here to help with your insurance questions. How can I assist you today?", 'bot');
    
    // Make sure the message container is updated
    const messagesContainer = document.querySelector('.chatbot-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
      console.error('Messages container not found');
    }
    
    console.log('Chatbot initialized successfully with welcome message');
  }

  // Create UI elements
  createUI() {
    // Create toggle button
    const toggleButton = document.createElement('div');
    toggleButton.className = 'chatbot-toggle-btn';
    toggleButton.innerHTML = '<i class="fas fa-comment"></i>';
    document.body.appendChild(toggleButton);

    // Create chatbot container
    const chatbotContainer = document.createElement('div');
    chatbotContainer.className = 'chatbot-container';
    chatbotContainer.style.display = 'none'; // Initially hidden
    
    chatbotContainer.innerHTML = `
      <div class="chatbot-header">
        <h3>Insurance Assistant</h3>
        <button class="chatbot-close-btn">&times;</button>
      </div>
      <div class="chatbot-messages"></div>
      <div class="chatbot-input-area">
        <input type="text" class="chatbot-input" placeholder="Type your message...">
        <button class="chatbot-send-btn">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(chatbotContainer); // Add to DOM after setting innerHTML
    
    // Add direct click handler to toggle button
    toggleButton.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      chatbotContainer.style.display = this.isOpen ? 'flex' : 'none';
      if (this.isOpen) {
        const inputField = chatbotContainer.querySelector('.chatbot-input-area input');
        if (inputField) inputField.focus();
      }
    });
    
    // Set up other event listeners
    this.setupEventListeners();
  }

  // Set up event listeners
  setupEventListeners() {
    // Get DOM elements - use document.querySelector to ensure we're finding elements in the DOM
    const chatbotContainer = document.querySelector('.chatbot-container');
    this.chatbotContainer = chatbotContainer; // Store reference to container
    
    if (!chatbotContainer) {
      console.error('Chatbot container not found');
      return;
    }
    
    const closeButton = chatbotContainer.querySelector('.chatbot-close-btn');
    const sendButton = chatbotContainer.querySelector('.chatbot-send-btn');
    const inputField = chatbotContainer.querySelector('.chatbot-input');
    
    console.log('Elements found:', { 
      closeButton: !!closeButton, 
      sendButton: !!sendButton, 
      inputField: !!inputField 
    });

    // Close chatbot
    if (closeButton) {
      // Remove any existing listeners to prevent duplicates
      closeButton.replaceWith(closeButton.cloneNode(true));
      const newCloseButton = chatbotContainer.querySelector('.chatbot-close-btn');
      
      newCloseButton.addEventListener('click', () => {
        console.log('Close button clicked');
        this.isOpen = false;
        chatbotContainer.style.display = 'none';
      });
    } else {
      console.error('Close button not found');
    }

    // Send message on button click
    if (sendButton) {
      // Remove any existing listeners to prevent duplicates
      sendButton.replaceWith(sendButton.cloneNode(true));
      const newSendButton = chatbotContainer.querySelector('.chatbot-send-btn');
      
      newSendButton.addEventListener('click', () => {
        console.log('Send button clicked');
        this.handleSendMessage();
      });
    } else {
      console.error('Send button not found');
    }

    // Send message on Enter key
    if (inputField) {
      // Remove any existing listeners to prevent duplicates
      inputField.replaceWith(inputField.cloneNode(true));
      const newInputField = chatbotContainer.querySelector('.chatbot-input');
      
      newInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          console.log('Enter key pressed');
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    } else {
      console.error('Input field not found');
    }
  }
  
  // Handle send message
  handleSendMessage() {
    const inputField = this.chatbotContainer.querySelector('.chatbot-input');
    if (!inputField) {
      console.error('Input field not found');
      return;
    }
    
    const message = inputField.value.trim();
    if (message) {
      // Add user message to chat
      this.addMessage(message, 'user');
      
      // Clear input field
      inputField.value = '';
      
      // Show typing indicator
      this.showTypingIndicator();
      
      // Process message and respond after a short delay
      setTimeout(() => {
        this.respondToMessage(message);
      }, 1000);
    }
  }

  // Show typing indicator
  showTypingIndicator() {
    const messagesContainer = document.querySelector('.chatbot-container .chatbot-messages');
    
    // Create typing indicator if it doesn't exist
    if (!document.querySelector('.chatbot-container .typing-indicator')) {
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'typing-indicator';
      typingIndicator.innerHTML = '<span></span><span></span><span></span>';
      messagesContainer.appendChild(typingIndicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Hide typing indicator
  hideTypingIndicator() {
    const typingIndicator = document.querySelector('.chatbot-container .typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Respond to user message
  respondToMessage(message) {
    const messageLower = message.toLowerCase();
    let response = '';
    
    // Check for insurance types
    if (messageLower.includes('types') || messageLower.includes('offer') || messageLower.includes('available')) {
      response = "We offer several types of insurance: auto, home, health, and life insurance. Each can be customized to meet your specific needs.";
    }
    // Check for auto insurance
    else if (messageLower.includes('auto') || messageLower.includes('car') || messageLower.includes('vehicle')) {
      response = "Our auto insurance provides comprehensive coverage for your vehicle, including liability, collision, and comprehensive options.";
    }
    // Check for home insurance
    else if (messageLower.includes('home') || messageLower.includes('house') || messageLower.includes('property')) {
      response = "Our home insurance protects your property and belongings against damage, theft, and liability. We offer customizable policies to fit your specific needs.";
    }
    // Check for health insurance
    else if (messageLower.includes('health') || messageLower.includes('medical') || messageLower.includes('doctor')) {
      response = "Our health insurance plans provide coverage for medical expenses, prescriptions, and preventive care. We offer various plans to suit different needs and budgets.";
    }
    // Check for life insurance
    else if (messageLower.includes('life')) {
      response = "Our life insurance policies provide financial protection for your loved ones in case of your passing. We offer term life and whole life options.";
    }
    // Check for contact information
    else if (messageLower.includes('contact') || messageLower.includes('phone') || messageLower.includes('email')) {
      response = "You can contact us at (555) 123-4567 or email us at info@secureshield.com.";
    }
    // Check for quotes
    else if (messageLower.includes('quote') || messageLower.includes('cost') || messageLower.includes('price')) {
      response = "We offer competitive quotes for all our insurance types. You can request a personalized quote by filling out the form on our website or calling us directly.";
    }
    // Check for greetings
    else if (messageLower.includes('hi') || messageLower.includes('hello') || messageLower.includes('hey')) {
      response = "Hello! How can I assist you with your insurance needs today?";
    }
    // Check for thanks
    else if (messageLower.includes('thank') || messageLower.includes('thanks')) {
      response = "You're welcome! Is there anything else I can help you with?";
    }
    // Default response
    else {
      response = "I'm here to help with any insurance questions you might have. You can ask about our auto, home, health, or life insurance options, or how to get a quote.";
    }
    
    // Hide typing indicator and add bot response
    this.hideTypingIndicator();
    this.addMessage(response, 'bot');
  }

  // Add message to chat
  addMessage(message, sender) {
    const messagesContainer = document.querySelector('.chatbot-container .chatbot-messages');
    if (!messagesContainer) return;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('chatbot-message', `${sender}-message`);
    messageElement.textContent = message;
    
    // Add message to container
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create global chatbot instance
  window.chatbot = new InsuranceChatbot();
  
  // Initialize the chatbot with a small delay to ensure DOM is fully loaded
  setTimeout(() => {
    window.chatbot.initialize();
    console.log('Chatbot initialized with delay');
  }, 500);
});