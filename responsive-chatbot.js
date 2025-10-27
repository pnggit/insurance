/**
 * Responsive Insurance Chatbot
 * Handles user interactions, displays messages, and provides responses
 */
class InsuranceChatbot {
    constructor() {
        // Initialize properties
        this.isOpen = false;
        this.isTyping = false;
        this.container = document.getElementById('chatbot-container');
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.inputField = document.getElementById('chatbot-input');
        this.toggleButton = document.getElementById('chatbot-toggle');
        this.closeButton = document.getElementById('chatbot-close');
        this.sendButton = document.getElementById('chatbot-send');
        
        // Insurance knowledge base for simple responses
        this.knowledgeBase = [
            { keywords: ['hello', 'hi', 'hey'], response: "Hello! How can I assist you with your insurance needs today?" },
            { keywords: ['auto', 'car', 'vehicle'], response: "Our auto insurance covers liability, collision, and comprehensive options. Would you like a quote?" },
            { keywords: ['home', 'house', 'property'], response: "Our home insurance protects your property and belongings against damage and theft. Would you like more information?" },
            { keywords: ['health', 'medical'], response: "Our health insurance plans cover medical expenses, prescriptions, and preventive care. Would you like to speak with a health insurance specialist?" },
            { keywords: ['life'], response: "Our life insurance provides financial protection for your loved ones. We offer term and whole life policies." },
            { keywords: ['quote', 'price', 'cost'], response: "I'd be happy to help you get a quote. Could you specify which type of insurance you're interested in?" },
            { keywords: ['contact', 'phone', 'number', 'email'], response: "You can reach our customer service at 1-800-555-0123 or email us at support@secureshield.example.com" },
            { keywords: ['claim', 'file'], response: "To file a claim, please call our claims department at 1-800-555-0199 or use our mobile app." }
        ];
        
        // Initialize the chatbot
        this.initialize();
    }
    
    // Set up the chatbot
    initialize() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Log initialization
        console.log('Chatbot initialized successfully');
    }
    
    // Set up event listeners for user interactions
    setupEventListeners() {
        // Toggle chatbot visibility
        this.toggleButton.addEventListener('click', () => {
            this.toggleChatbot();
        });
        
        // Close chatbot
        this.closeButton.addEventListener('click', () => {
            this.closeChatbot();
        });
        
        // Send message on button click
        this.sendButton.addEventListener('click', () => {
            this.handleSendMessage();
        });
        
        // Send message on Enter key
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
    }
    
    // Toggle chatbot visibility
    toggleChatbot() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.container.style.display = 'flex';
            this.container.classList.add('show');
            this.inputField.focus();
            
            // Show welcome message if this is the first time opening
            if (this.messagesContainer.children.length === 0) {
                this.addMessage("Welcome to SecureShield Insurance Assistant! I'm here to help with your insurance questions. How can I assist you today?", 'bot');
            }
        } else {
            this.container.classList.remove('show');
            setTimeout(() => {
                this.container.style.display = 'none';
            }, 300);
        }
    }
    
    // Close the chatbot
    closeChatbot() {
        this.isOpen = false;
        this.container.classList.remove('show');
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 300);
    }
    
    // Handle sending a message
    handleSendMessage() {
        try {
            const message = this.inputField.value.trim();
            
            // Validate input
            if (!message) {
                return;
            }
            
            // Add user message to chat
            this.addMessage(message, 'user');
            
            // Clear input field
            this.inputField.value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            // Process message and respond after a short delay
            setTimeout(() => {
                this.respondToMessage(message);
            }, 1000);
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage("I'm sorry, there was an error processing your message. Please try again.", 'bot');
        }
    }
    
    // Show typing indicator
    showTypingIndicator() {
        this.isTyping = true;
        
        // Create typing indicator if it doesn't exist
        if (!document.querySelector('.typing-indicator')) {
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = '<span></span><span></span><span></span>';
            this.messagesContainer.appendChild(typingIndicator);
            this.scrollToBottom();
        }
    }
    
    // Hide typing indicator
    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Add a message to the chat
    addMessage(text, sender) {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.textContent = text;
        
        // Remove typing indicator if it exists
        this.hideTypingIndicator();
        
        // Add message to container
        this.messagesContainer.appendChild(messageElement);
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    // Respond to user message
    respondToMessage(message) {
        // Convert message to lowercase for matching
        const lowerMessage = message.toLowerCase();
        
        // Find matching response from knowledge base
        let response = "I'm sorry, I don't have information about that. Would you like to speak with a customer service representative?";
        
        for (const item of this.knowledgeBase) {
            for (const keyword of item.keywords) {
                if (lowerMessage.includes(keyword)) {
                    response = item.response;
                    break;
                }
            }
        }
        
        // Add bot response
        this.addMessage(response, 'bot');
    }
    
    // Scroll messages container to bottom
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize the chatbot when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create new chatbot instance
        const chatbot = new InsuranceChatbot();
        console.log('Chatbot loaded successfully');
        
        // Make chatbot accessible globally for debugging
        window.insuranceChatbot = chatbot;
    } catch (error) {
        console.error('Error initializing chatbot:', error);
    }
});