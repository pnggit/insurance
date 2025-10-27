/**
 * WebScraper - A simple utility to scrape text content from a website
 * @class
 */
class WebScraper {
  /**
   * Scrape text content from a URL
   * @param {string} url - URL to scrape
   * @returns {Promise<Array>} - Array of document objects with text and source
   */
  async scrapeUrl(url) {
    try {
      console.log(`Scraping content from ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Create a DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract text from relevant elements
      const documents = [];
      
      // Extract headings
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        const text = heading.textContent.trim();
        if (text) {
          documents.push({
            text,
            source: 'Heading',
            element: heading.tagName.toLowerCase()
          });
        }
      });
      
      // Extract paragraphs
      const paragraphs = doc.querySelectorAll('p');
      paragraphs.forEach(paragraph => {
        const text = paragraph.textContent.trim();
        if (text) {
          documents.push({
            text,
            source: 'Paragraph',
            element: 'p'
          });
        }
      });
      
      // Extract list items
      const listItems = doc.querySelectorAll('li');
      listItems.forEach(item => {
        const text = item.textContent.trim();
        if (text) {
          documents.push({
            text,
            source: 'List',
            element: 'li'
          });
        }
      });
      
      // Extract meta descriptions
      const metaDesc = doc.querySelector('meta[name="description"]');
      if (metaDesc && metaDesc.getAttribute('content')) {
        documents.push({
          text: metaDesc.getAttribute('content'),
          source: 'Meta',
          element: 'meta'
        });
      }
      
      console.log(`Extracted ${documents.length} text elements from ${url}`);
      return documents;
    } catch (error) {
      console.error('Error scraping URL:', error);
      return [];
    }
  }
}

// Make available globally
window.WebScraper = WebScraper;