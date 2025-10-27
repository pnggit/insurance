/**
 * SimpleVectorStore - A lightweight in-memory vector store for semantic search
 */
class SimpleVectorStore {
  constructor() {
    this.documents = [];
  }

  /**
   * Add documents to the vector store
   * @param {Array} documents - Array of document objects with text and metadata
   */
  addDocuments(documents) {
    this.documents.push(...documents);
    console.log(`Added ${documents.length} documents to vector store`);
    return this.documents.length;
  }

  /**
   * Create a simple vector from text (term frequency)
   * @param {string} text - Text to vectorize
   * @returns {Object} - Term frequency vector
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
   * Calculate cosine similarity between two vectors
   * @param {Object} vector1 - First vector
   * @param {Object} vector2 - Second vector
   * @returns {number} - Similarity score between 0 and 1
   */
  calculateSimilarity(vector1, vector2) {
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
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Search for similar documents
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @returns {Array} - Array of document objects with similarity scores
   */
  search(query, topK = 3) {
    if (this.documents.length === 0) {
      return [];
    }

    const queryVector = this.createVector(query);
    
    // Calculate similarity scores
    const results = this.documents.map(doc => {
      const docVector = this.createVector(doc.text);
      const similarity = this.calculateSimilarity(queryVector, docVector);
      return { document: doc, score: similarity };
    });
    
    // Sort by score and return top K results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

// Make available globally
window.SimpleVectorStore = SimpleVectorStore;