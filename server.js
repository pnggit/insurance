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
app.get('/api/scrape-content', async (req, res) => {
  try {
    // Scrape content from the website (allow override via query param)
    const targetUrl = req.query.url || 'http://localhost:8888';
    const content = await scrapeWebsite(targetUrl);
    res.json(content);
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

// Create a file with scraped content (text + json) for later chatbot ingestion
app.post('/api/scrape-to-file', async (req, res) => {
  try {
    const targetUrl = (req.body && req.body.url) || req.query.url || 'http://localhost:8888';
    const chunks = await scrapeWebsite(targetUrl);

    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const txtPath = path.join(dataDir, 'scraped.txt');
    const jsonPath = path.join(dataDir, 'scraped.json');

    const textContent = chunks.map(c => c.text).filter(Boolean).join('\n\n');
    fs.writeFileSync(txtPath, textContent, 'utf8');
    fs.writeFileSync(jsonPath, JSON.stringify(chunks, null, 2), 'utf8');

    console.log(`Scraped ${chunks.length} chunks from ${targetUrl} and wrote to ${txtPath}`);
    res.json({ success: true, count: chunks.length, txt: '/data/scraped.txt', json: '/data/scraped.json' });
  } catch (error) {
    console.error('Error scraping to file:', error);
    res.status(500).json({ success: false, error: 'Failed to scrape and write file' });
  }
});

// Serve the scraped text file via API
app.get('/api/scraped-file', (req, res) => {
  try {
    const txtPath = path.join(__dirname, 'data', 'scraped.txt');
    if (!fs.existsSync(txtPath)) {
      return res.status(404).json({ error: 'scraped.txt not found' });
    }
    res.setHeader('Content-Type', 'text/plain');
    fs.createReadStream(txtPath).pipe(res);
  } catch (error) {
    console.error('Error reading scraped file:', error);
    res.status(500).json({ error: 'Failed to read scraped file' });
  }
});

// Serve the scraped documents JSON via API
app.get('/api/scraped-json', (req, res) => {
  try {
    const jsonPath = path.join(__dirname, 'data', 'scraped.json');
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'scraped.json not found' });
    }
    res.setHeader('Content-Type', 'application/json');
    const content = fs.readFileSync(jsonPath, 'utf8');
    res.send(content);
  } catch (error) {
    console.error('Error reading scraped json:', error);
    res.status(500).json({ error: 'Failed to read scraped json' });
  }
});

// Add FAISS endpoints
const faissService = require('./faissService');

app.post('/api/faiss/build', async (req, res) => {
  try {
    const targetFile = req.body?.filePath || path.join(__dirname, 'data', 'scraped.txt');
    const result = await faissService.buildFaissFromFile(targetFile);
    res.json({ success: true, ...result, indexPath: '/data/faiss.index', metaPath: '/data/faiss_meta.json' });
  } catch (error) {
    console.error('Error building FAISS index:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to build FAISS index' });
  }
});

app.get('/api/faiss/search', async (req, res) => {
  try {
    const q = req.query.q;
    const k = parseInt(req.query.k || '4', 10);
    if (!q) return res.status(400).json({ error: 'Missing q parameter' });
    const hits = await faissService.searchFaiss(q, k);
    res.json({ success: true, hits });
  } catch (error) {
    console.error('Error searching FAISS index:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to search FAISS index' });
  }
});

app.post('/api/faiss/answer', async (req, res) => {
  try {
    const q = req.body?.q;
    const k = parseInt(req.body?.k || '4', 10);
    if (!q) return res.status(400).json({ error: 'Missing q in body' });
    const result = await faissService.answerWithGemini(q, k);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error generating FAISS answer:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate answer' });
  }
});

// Streaming SSE endpoint for better UX
app.get('/api/faiss/answer/stream', async (req, res) => {
  try {
    const q = req.query?.q;
    const k = parseInt(req.query?.k || '4', 10);
    if (!q) {
      res.status(400).json({ error: 'Missing q parameter' });
      return;
    }
    // Prepare SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Retrieve context via FAISS
    const hits = await faissService.searchFaiss(q, k);
    const citations = await faissService.enrichCitations(hits);
    send('status', { usingServerContext: true });
    send('context', { citations });

    // Build prompt
    const contextText = hits.map((h, i) => `[#${i+1} score=${h.score.toFixed(3)}]\n${h.text}`).join('\n\n');
    const prompt = [
      'You are a helpful assistant answering questions using the provided context.',
      'Use only the context to answer. If missing, say you do not know.',
      'Cite sources using bracketed numbers [#1], [#2] matching context chunks.',
      '',
      `Question: ${q}`,
      '',
      'Context:',
      contextText,
    ].join('\n');

    // Stream generation tokens if available
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    try {
      const request = { contents: [{ role: 'user', parts: [{ text: prompt }]}] };
      const result = await model.generateContentStream(request);
      // Stream tokens as they arrive
      for await (const item of result.stream) {
        let token = '';
        try {
          token = item?.candidates?.[0]?.content?.parts?.map(p => p?.text || '').join('') || item?.text?.() || '';
        } catch (e) {
          token = item?.text?.() || '';
        }
        if (token) send('token', { text: token });
      }
      send('done', {});
      res.end();
    } catch (err) {
      // Fallback to non-streaming response
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const resp = await model.generateContent(prompt);
        const text = resp?.response?.text?.() || resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        send('token', { text });
        send('done', {});
        res.end();
      } catch (err2) {
        send('error', { message: err2.message || 'Failed to generate answer' });
        res.end();
      }
    }
  } catch (error) {
    console.error('Error in streaming answer:', error);
    try {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: error.message || 'Failed to stream answer' })}\n\n`);
    } catch {}
    res.end();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});