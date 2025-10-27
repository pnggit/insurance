const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes text content from the specified URL
 * @param {string} url - The URL to scrape
 * @returns {Promise<Array<{text: string, source: string}>>} - Array of text chunks with their sources
 */
async function scrapeWebsite(url) {
  try {
    console.log(`Scraping content from ${url}...`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, noscript, iframe').remove();
    
    // Extract text from different sections with their sources
    const textChunks = [];
    
    // Extract header content
    const headerText = $('header').text().trim();
    if (headerText) {
      textChunks.push({
        text: cleanText(headerText),
        source: 'Header'
      });
    }
    
    // Extract navigation content
    const navText = $('nav').text().trim();
    if (navText) {
      textChunks.push({
        text: cleanText(navText),
        source: 'Navigation'
      });
    }
    
    // Extract main content sections
    $('section, article, .container, main, div.row').each((i, element) => {
      const sectionText = $(element).text().trim();
      if (sectionText && sectionText.length > 50) { // Only include substantial sections
        const headingElement = $(element).find('h1, h2, h3').first();
        const heading = headingElement.length ? headingElement.text().trim() : `Section ${i+1}`;
        
        textChunks.push({
          text: cleanText(sectionText),
          source: heading
        });
      }
    });
    
    // Extract paragraphs
    $('p').each((i, element) => {
      const paragraphText = $(element).text().trim();
      if (paragraphText && paragraphText.length > 30) { // Only include substantial paragraphs
        textChunks.push({
          text: cleanText(paragraphText),
          source: 'Paragraph'
        });
      }
    });
    
    // Extract footer content
    const footerText = $('footer').text().trim();
    if (footerText) {
      textChunks.push({
        text: cleanText(footerText),
        source: 'Footer'
      });
    }
    
    console.log(`Extracted ${textChunks.length} text chunks from ${url}`);
    return textChunks;
  } catch (error) {
    console.error('Error scraping website:', error);
    return [];
  }
}

/**
 * Clean and normalize text content
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
    .replace(/\n+/g, ' ')    // Replace newlines with spaces
    .replace(/\t+/g, ' ')    // Replace tabs with spaces
    .trim();                 // Remove leading/trailing whitespace
}

module.exports = { scrapeWebsite };