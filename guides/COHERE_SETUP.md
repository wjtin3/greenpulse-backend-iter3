# Cohere Embeddings Setup Guide

This guide explains how to set up and use Cohere embeddings in the GreenPulse backend.

## 🚀 Quick Start

### 1. Get Cohere API Key
1. Go to [Cohere AI](https://cohere.ai/)
2. Sign up for an account
3. Get your API key from the dashboard

### 2. Set Environment Variable
Create a `.env` file in your project root:
```env
COHERE_API_KEY=your_cohere_api_key_here
```

### 3. Test the Setup
Run the test script:
```bash
node test-cohere.js
```

## 📡 API Endpoints

### Health Check
```bash
GET /api/cohere/health
```

### Generate Basic Embedding
```bash
POST /api/cohere/test-embedding
Content-Type: application/json

{
  "text": "Reduce carbon footprint by using public transport",
  "type": "search_document"
}
```

### Generate Search Query Embedding
```bash
POST /api/cohere/test-embedding
Content-Type: application/json

{
  "text": "How to reduce travel emissions in Malaysia",
  "type": "search_query"
}
```

### Generate Embedding with Debug Info
```bash
POST /api/cohere/test-embedding-debug
Content-Type: application/json

{
  "text": "Carbon footprint reduction tips",
  "type": "search_document"
}
```

### Generate Recommendation Embedding
```bash
POST /api/cohere/test-recommendation-embedding
Content-Type: application/json

{
  "title": "Use LRT for daily commute",
  "content": "Malaysia's LRT system is efficient and eco-friendly",
  "category": "travel",
  "context": "Malaysian public transport",
  "tags": ["public transport", "LRT", "emissions"]
}
```

## 🔧 Service Methods

### Basic Usage
```javascript
import { cohereService } from './services/cohereService.js';

// Generate embedding for text
const embedding = await cohereService.generateEmbedding("Your text here");

// Generate search query embedding
const searchEmbedding = await cohereService.generateSearchEmbedding("search query");

// Generate recommendation embedding
const recEmbedding = await cohereService.generateRecommendationEmbedding({
  title: "Title",
  content: "Content",
  category: "travel",
  context: "Context",
  tags: ["tag1", "tag2"]
});
```

### Debug Mode
```javascript
// Generate embedding with debug information
const result = await cohereService.generateSearchEmbeddingWithDebug("query");
console.log(result.debug); // Debug information
console.log(result.embedding); // The embedding vector
```

## 📊 Embedding Details

- **Model**: `embed-multilingual-v3.0`
- **Dimensions**: 1024
- **Input Types**: 
  - `search_document` - For storing documents
  - `search_query` - For search queries
- **Language Support**: Multilingual (including Malay)

## 🧪 Testing

### Run All Tests
```bash
node test-cohere.js
```

### Test Individual Endpoints
```bash
# Health check
curl https://gp-backend-iter2.vercel.app/api/cohere/health

# Basic embedding
curl -X POST https://gp-backend-iter2.vercel.app/api/cohere/test-embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "test text", "type": "search_document"}'
```

## 🔍 Debug Information

When using debug mode, you get detailed information:
- Input text
- Model used
- Input type
- Embedding vector
- Dimension count
- Tokens used
- Response time
- API version
- Timestamp

## ⚠️ Error Handling

Common errors and solutions:

### Missing API Key
```
Error: COHERE_API_KEY environment variable is required
```
**Solution**: Add your Cohere API key to the `.env` file

### Invalid API Key
```
Error: Failed to generate embedding: Invalid API key
```
**Solution**: Check your API key is correct and active

### Rate Limiting
```
Error: Rate limit exceeded
```
**Solution**: Wait a moment and try again, or upgrade your Cohere plan

## 🚀 Next Steps

1. ✅ Cohere embeddings are now set up
2. 🔄 Next: Set up vector search with pgvector
3. 🔄 Next: Create recommendation knowledge base
4. 🔄 Next: Integrate with carbon footprint calculations

## 📚 Resources

- [Cohere AI Documentation](https://docs.cohere.ai/)
- [Embeddings API Reference](https://docs.cohere.ai/reference/embed)
- [Multilingual Models](https://docs.cohere.ai/docs/multilingual-language-models)
