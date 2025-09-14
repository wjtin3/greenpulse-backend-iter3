# 🌱 GreenPulse RAG System Setup Guide

This guide will help you set up the complete RAG (Retrieval-Augmented Generation) system that combines Cohere embeddings with Groq LLM for personalized carbon footprint recommendations.

## 📋 Latest Updates (v3.0)

- ✅ **Optimized PostgreSQL Schema**: High-performance database with proper indexing
- ✅ **Complete Data Population**: 658 emission factors, 30 recommendations with embeddings
- ✅ **Malaysian Context**: Localized emission factors and recommendations
- ✅ **Vector Search**: Semantic search using Cohere embeddings
- ✅ **Multi-Category Support**: Travel, Household, Food, Shopping calculations
- ✅ **Clean Codebase**: Removed redundant scripts and optimized structure
- ✅ **Comprehensive Testing**: Full test suite for all features

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Cohere API key
- Groq API key

### 2. Environment Variables
Create a `.env` file with:
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/greenpulse

# AI Services
COHERE_API_KEY=your_cohere_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Server
API_PORT=3001
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database
```bash
# Create RAG system tables and seed data
node scripts/setupRAGTables.js

# Generate embeddings for all recommendations
node scripts/populateEmbeddings.js
```

### 5. Verify Setup
```bash
# Test the recommendation system
node test-recommendations.js

# Check database status
node -e "import('./config/database.js').then(async ({pool}) => { const client = await pool.connect(); const result = await client.query('SELECT COUNT(*) as count FROM recommendations_kb WHERE embedding IS NOT NULL'); console.log('Recommendations with embeddings:', result.rows[0].count); client.release(); })"
```

### 6. Start the Server
```bash
npm run dev
```

### 7. Test the System
Open your browser and navigate to:
- **RAG Test Interface**: `http://localhost:3001/rag-test.html`
- **Cohere Test Interface**: `http://localhost:3001/index.html`
- **Groq Test Interface**: `http://localhost:3001/groq-test.html`

## 📊 System Architecture

### Components

1. **Cohere Service** (`services/cohereService.js`)
   - Generates embeddings for text using `embed-multilingual-v3.0`
   - Supports both document and query embeddings
   - Includes debug functionality

2. **Vector Service** (`services/vectorService.js`)
   - Performs similarity search using embeddings
   - Stores and retrieves recommendations with embeddings
   - Supports batch operations

3. **Recommendation Service** (`services/recommendationService.js`)
   - Orchestrates the complete RAG pipeline
   - Combines vector search with Groq LLM
   - Generates personalized recommendations

4. **Groq Service** (`services/groqService.js`)
   - Generates AI responses using Groq LLM
   - Supports model fallback (primary: `openai/gpt-oss-120b`, backup: `openai/gpt-oss-20b`)
   - User-friendly output formatting

### Database Tables

1. **recommendations_kb**
   - Stores recommendation content with vector embeddings
   - Categories: travel, household, food, shopping
   - Includes impact level, difficulty, cost impact
   - Uses pgvector for similarity search

2. **carbon_emission_factors**
   - Unified emission factors from all categories (658 total records)
   - Categories: travel (24), food (211), shopping (413), household (10)
   - No user tracking - data only, no source column

## 🔧 API Endpoints

### Recommendations API (`/api/recommendations`)

- `POST /generate` - Generate personalized recommendations using RAG
- `POST /search` - Search recommendations using vector similarity
- `GET /category/:category` - Get recommendations by category
- `GET /popular/:category` - Get random recommendations (no user tracking)
- `GET /emission-factors/:category` - Get emission factors
- `GET /health` - Health check

**Note**: No user tracking endpoints - system operates without storing user data

### Example RAG Request
```javascript
POST /api/recommendations/generate
{
  "category": "travel",
  "totalEmissions": 45.20,
  "calculationData": {
    "privateTransport": [{
      "vehicleType": "car",
      "distance": 100,
      "fuelType": "petrol"
    }],
    "publicTransport": [{
      "transportType": "bus",
      "distance": 30
    }]
  },
  "debugMode": true
}
```

## 🧪 Testing

### 1. RAG System Test
- Navigate to `http://localhost:3001/rag-test.html`
- Test the complete RAG pipeline
- Includes vector search and AI generation

### 2. Individual Component Tests
- **Cohere**: `http://localhost:3001/index.html`
- **Groq**: `http://localhost:3001/groq-test.html`

### 3. API Testing
Use the provided test interfaces or tools like Postman/curl:

```bash
# Test RAG recommendations
curl -X POST http://localhost:3001/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -d '{
    "category": "travel",
    "totalEmissions": 45.20,
    "calculationData": {"privateTransport": [{"vehicleType": "car", "distance": 100}]}
  }'

# Test vector search
curl -X POST http://localhost:3001/api/recommendations/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "public transport commuting",
    "category": "travel",
    "limit": 5
  }'
```

## 📈 Features

### RAG Pipeline
1. **User Context Building** - Converts user data into searchable context
2. **Vector Search** - Finds similar recommendations using embeddings
3. **AI Generation** - Groq LLM generates personalized recommendations
4. **Response Parsing** - Separates user-friendly content from structured data

### User-Friendly Output
- Simple, actionable recommendations
- Malaysian context and local tips
- Emoji-enhanced formatting
- No complex tables (as requested)

### Debug Mode
- Detailed logging and timing information
- Cohere embedding debug data
- Vector search results
- Processing time metrics

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill existing process
   npx kill-port 3001
   # Or change port in .env
   API_PORT=3002
   ```

2. **Database Connection Issues**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify database exists

3. **API Key Issues**
   - Verify COHERE_API_KEY and GROQ_API_KEY
   - Check API key permissions and quotas

4. **Embedding Generation Fails**
   - Check Cohere API key and quota
   - Verify internet connection
   - Check rate limits

### Logs and Debugging
- Enable debug mode in requests
- Check server console for detailed logs
- Use browser developer tools for frontend issues

## 🚀 Production Deployment

### Environment Setup
1. Set up production database
2. Configure environment variables
3. Set up API key management
4. Configure rate limiting

### Performance Optimization
1. Use connection pooling
2. Implement caching for embeddings
3. Set up monitoring and logging
4. Configure backup strategies

## 📚 Additional Resources

- [Cohere API Documentation](https://docs.cohere.ai/)
- [Groq API Documentation](https://console.groq.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## 🎯 Next Steps

1. **Test the complete system** using the provided interfaces
2. **Customize recommendations** by modifying the seed data
3. **Add more categories** or emission factors
4. **Implement user authentication** for personalized experiences
5. **Add analytics dashboard** for usage insights

---

**Happy coding! 🌱✨**

The RAG system is now ready to provide intelligent, personalized carbon footprint recommendations powered by the latest AI technology!
