// Immediate fix for chatbot visibility
document.addEventListener('DOMContentLoaded', function() {
  // Force create the chatbot button if it doesn't exist
  if (!document.querySelector('.chatbot-toggle-btn')) {
    const button = document.createElement('div');
    button.className = 'chatbot-toggle-btn';
    button.innerHTML = '<i class="fas fa-comment"></i>';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = '#0056b3';
    button.style.color = 'white';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    button.style.zIndex = '9999';
    
    document.body.appendChild(button);
    
    // Add click event to toggle chatbot
    button.addEventListener('click', function() {
      const container = document.querySelector('.chatbot-container');
      if (container) {
        container.classList.toggle('chatbot-hidden');
      } else {
        // If container doesn't exist, initialize chatbot
        if (typeof Chatbot !== 'undefined') {
          const chatbot = new Chatbot();
          chatbot.initialize();
        }
      }
    });
  } else {
    // Fix existing button
    const button = document.querySelector('.chatbot-toggle-btn');
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = '#0056b3';
    button.style.color = 'white';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    button.style.zIndex = '9999';
    button.classList.remove('chatbot-hidden');
  }
});