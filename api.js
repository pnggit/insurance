// API endpoints for the insurance website

// Endpoint to scrape website content
app.get('/api/scrape-content', async (req, res) => {
  try {
    // In a real implementation, this would scrape the actual website content
    // For this demo, we'll return predefined content
    const websiteContent = [
      { text: 'SecureShield Insurance offers comprehensive auto insurance coverage to protect you and your vehicle on the road.', source: 'Auto Insurance' },
      { text: 'Our home insurance policies cover your property, belongings, and provide liability protection.', source: 'Home Insurance' },
      { text: 'SecureShield health insurance plans include coverage for doctor visits, hospital stays, and prescription medications.', source: 'Health Insurance' },
      { text: 'Life insurance from SecureShield provides financial security for your loved ones in the event of your passing.', source: 'Life Insurance' },
      { text: 'Get a personalized insurance quote online or by calling our customer service at (555) 123-4567.', source: 'Quotes' },
      { text: 'Our team of experienced insurance agents is available to help you find the right coverage for your needs.', source: 'Agents' },
      { text: 'SecureShield Insurance has been providing reliable coverage to customers for over 25 years.', source: 'About Us' },
      { text: 'Contact us at info@secureshield.com or call (555) 123-4567 for assistance with your insurance needs.', source: 'Contact' },
      { text: 'Our claims process is simple and efficient, allowing you to get back to normal as quickly as possible.', source: 'Claims' },
      { text: 'SecureShield offers discounts for bundling multiple insurance policies together.', source: 'Discounts' },
      { text: 'We provide 24/7 customer support for all your insurance questions and concerns.', source: 'Support' },
      { text: 'SecureShield Insurance is committed to providing exceptional service and comprehensive coverage at competitive rates.', source: 'Mission' }
    ];
    
    res.json(websiteContent);
  } catch (error) {
    console.error('Error scraping content:', error);
    res.status(500).json({ error: 'Failed to scrape website content' });
  }
});