const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Import scraper
const { scrapeWebsite } = require('./scraper');

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint for scraping website content
app.get('/api/scrape-content', (req, res) => {
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

// API endpoint for form submission
app.post('/api/submit-form', async (req, res) => {
  try {
    const { name, email, phone, insuranceType, message } = req.body;
    
    // Validate form data
    if (!name || !email || !phone || !insuranceType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill all required fields' 
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address' 
      });
    }
    
    // Phone validation
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phone.replace(/[^0-9]/g, ''))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid phone number' 
      });
    }

    // Save form data to CSV file based on insurance type
    try {
      const currentDate = new Date().toISOString();
      // Normalize insurance type to handle different formats (Auto, auto, AUTO, etc.)
      const insuranceTypeFormatted = insuranceType.toLowerCase().trim();
      
      // Map to standard insurance types
      let csvFileName;
      if (insuranceTypeFormatted.includes('auto')) {
        csvFileName = 'auto.csv';
      } else if (insuranceTypeFormatted.includes('home')) {
        csvFileName = 'home.csv';
      } else if (insuranceTypeFormatted.includes('health')) {
        csvFileName = 'health.csv';
      } else if (insuranceTypeFormatted.includes('life')) {
        csvFileName = 'life.csv';
      } else {
        csvFileName = 'other.csv';
      }
      
      const csvFilePath = path.join(__dirname, 'data', csvFileName);
      
      // Ensure data directory exists
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Check if file exists to determine if headers are needed
      const fileExists = fs.existsSync(csvFilePath);
      
      // Create CSV writer with proper header formatting
      const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
          {id: 'name', title: 'name'},
          {id: 'email', title: 'email'},
          {id: 'phone', title: 'phone'},
          {id: 'message', title: 'message'},
          {id: 'date', title: 'date'}
        ],
        append: fileExists,
        alwaysQuote: true
      });
      
      // Prepare data record with sanitized values
      const record = [{
        name: name.replace(/,/g, ' '), // Remove commas to prevent CSV issues
        email: email,
        phone: phone.replace(/[^0-9]/g, ''), // Keep only digits
        message: (message || '').replace(/,/g, ' '), // Remove commas
        date: currentDate
      }];
      
      // Write data to CSV file
      await csvWriter.writeRecords(record);
      console.log(`Data saved to ${csvFilePath}`);
    } catch (error) {
      console.error('Error saving to CSV:', error);
      // Continue with email sending even if CSV fails
    }

    // Setup email transporter (for production, use actual SMTP credentials)
    const transporter = nodemailer.createTransport({
      host: 'smtp.example.com', // Replace with actual SMTP host
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'your-email@example.com',
        pass: process.env.EMAIL_PASS || 'your-password'
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@example.com',
      to: 'info@secureshield.com', // Replace with recipient email
      subject: `New Insurance Quote Request - ${insuranceType}`,
      html: `
        <h2>New Insurance Quote Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Insurance Type:</strong> ${insuranceType}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      `
    };

    // For development, just log the email content instead of sending
    console.log('Email would be sent with:', mailOptions);
    
    // Uncomment to actually send email in production
    // await transporter.sendMail(mailOptions);

    // Send success response
    return res.status(200).json({ 
      success: true, 
      message: 'Your quote request has been submitted successfully. We will contact you shortly.' 
    });
    
  } catch (error) {
    console.error('Error submitting form:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Oops! Something went wrong. Please try again later or contact us directly.' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});