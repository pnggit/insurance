// Browser-compatible Vector Store implementation
class VectorStore {
  constructor() {
    this.documents = [];
    this.initialized = false;
  }

  /**
   * Initialize the vector store with documents
   * @param {Array<{text: string, source: string}>} documents - Array of text documents with sources
   */
  initialize(documents) {
    if (documents.length === 0) {
      console.warn('No documents provided for vector store initialization');
      return;
    }

    this.documents = documents;
    this.initialized = true;
    console.log(`Vector store initialized with ${documents.length} documents`);
  }

  /**
   * Create a simple term frequency vector for text
   * @param {string} text - The text to vectorize
   * @returns {Object} - Term frequency map
   */
  createVector(text) {
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    const vector = {};
    
    words.forEach(word => {
      vector[word] = (vector[word] || 0) + 1;
    });
    
    return vector;
  }

  /**
   * Calculate cosine similarity between two term frequency vectors
   * @param {Object} vector1 - First term frequency vector
   * @param {Object} vector2 - Second term frequency vector
   * @returns {number} - Similarity score between 0 and 1
   */
  cosineSimilarity(vector1, vector2) {
    const keys1 = Object.keys(vector1);
    const keys2 = Object.keys(vector2);
    
    // Calculate dot product
    let dotProduct = 0;
    keys1.forEach(key => {
      if (key in vector2) {
        dotProduct += vector1[key] * vector2[key];
      }
    });
    
    // Calculate magnitudes
    const magnitude1 = Math.sqrt(keys1.reduce((sum, key) => sum + vector1[key] * vector1[key], 0));
    const magnitude2 = Math.sqrt(keys2.reduce((sum, key) => sum + vector2[key] * vector2[key], 0));
    
    // Avoid division by zero
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Search for documents similar to the query
   * @param {string} query - The search query
   * @param {number} k - Number of results to return
   * @returns {Array<{document: Object, score: number}>} - Search results with similarity scores
   */
  search(query, k = 3) {
    if (!this.initialized || this.documents.length === 0) {
      console.warn('Vector store not initialized or empty');
      return [];
    }
    
    const queryVector = this.createVector(query);
    
    // Calculate similarity scores for all documents
    const results = this.documents.map((doc, index) => {
      const docVector = this.createVector(doc.text);
      const score = this.cosineSimilarity(queryVector, docVector);
      
      return {
        document: doc,
        score,
        index
      };
    });
    
    // Sort by similarity score (descending)
    results.sort((a, b) => b.score - a.score);
    
    // Return top k results
    return results.slice(0, k);
  }
}