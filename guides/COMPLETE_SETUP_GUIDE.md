# 🚀 GreenPulse Complete Setup Guide

This comprehensive guide will help you set up the complete GreenPulse backend system with all features including AI-powered recommendations, carbon footprint calculations, and Malaysian context.

## 📋 System Overview

GreenPulse is a comprehensive carbon footprint calculator backend featuring:
- **Multi-Category Calculations**: Travel, Household, Food, Shopping
- **AI-Powered Recommendations**: Smart suggestions using Cohere embeddings and Groq LLM
- **Malaysian Context**: Localized emission factors and recommendations
- **Vector Search**: Semantic search for relevant recommendations
- **PostgreSQL Optimized**: High-performance database with proper indexing

## 🛠️ Prerequisites

- **Node.js 18+** installed
- **PostgreSQL 12+** database running
- **Cohere API Key** for embeddings
- **Groq API Key** for LLM processing

## 🚀 Quick Setup (5 minutes)

### 1. Clone and Install
```bash
git clone <repository-url>
cd greenpulse-backend-iter2
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# AI Services
COHERE_API_KEY=your_cohere_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Database Setup
```bash
# Set up RAG tables and seed recommendation data
node scripts/setupRAGTables.js

# Generate embeddings for all recommendations
node scripts/populateEmbeddings.js
```

### 4. Start the Server
```bash
npm run dev
```

### 5. Verify Setup
```bash
# Test the recommendation system
node test-recommendations.js
```

## 📊 Current Data Status

After setup, your system will have:
- ✅ **658 Carbon Emission Factors** across all categories
- ✅ **30 AI Recommendations** with vector embeddings
- ✅ **413 Shopping Entities** with emission data
- ✅ **211 Food Items** with detailed emission factors
- ✅ **24 Vehicle Types** with size and fuel variations
- ✅ **10 Household Factors** across different regions

## 🧪 Testing

### Run All Tests
```bash
# Test recommendation API
node test-recommendations.js

# Test Cohere integration
node test-cohere.js

# Test Groq integration
node test-groq.js

# Test deployment
node test-deployment.js
```

### Test Individual Endpoints
```bash
# Health check
curl https://gp-backend-iter2.vercel.app/health

# Generate recommendations
curl -X POST https://gp-backend-iter2.vercel.app/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -d '{"category": "travel", "totalEmissions": 45.2, "calculationData": {...}}'

# Search recommendations
curl -X POST https://gp-backend-iter2.vercel.app/api/recommendations/search \
  -H "Content-Type: application/json" \
  -d '{"query": "reduce car emissions", "category": "travel"}'
```

## 🌐 Web Interfaces

Once running, access these test interfaces:
- **RAG Test Interface**: `https://gp-backend-iter2.vercel.app/rag-test.html`
- **Cohere Test Interface**: `https://gp-backend-iter2.vercel.app/index.html`
- **Groq Test Interface**: `https://gp-backend-iter2.vercel.app/groq-test.html`

## 📡 API Endpoints

### Carbon Footprint Calculations
- `POST /api/carbon-footprint/calculate` - Calculate carbon footprint for any category
- `POST /api/carbon-footprint/travel` - Calculate travel emissions
- `POST /api/carbon-footprint/household` - Calculate household emissions
- `POST /api/carbon-footprint/food` - Calculate food emissions
- `POST /api/carbon-footprint/shopping` - Calculate shopping emissions

### AI-Powered Recommendations
- `POST /api/recommendations/generate` - Generate personalized recommendations
- `POST /api/recommendations/search` - Search recommendations by query
- `GET /api/recommendations/category/:category` - Get recommendations by category
- `GET /api/recommendations/popular/:category` - Get popular recommendations
- `GET /api/recommendations/health` - Check recommendation service status

### Emission Factors
- `GET /api/emission-factors/:category` - Get emission factors by category
- `GET /api/emission-factors/search` - Search emission factors

## 🔧 Scripts Reference

### Database Management
- `scripts/setupRAGTables.js` - Set up recommendation system tables
- `scripts/populateEmbeddings.js` - Generate AI embeddings
- `scripts/import-csv-quoted.js` - Import CSV data with advanced parsing
- `scripts/clear-data.js` - Clear database data

### Data Population
```bash
# Complete system setup
node scripts/setupRAGTables.js
node scripts/populateEmbeddings.js

# Import CSV data
node scripts/import-csv-quoted.js
```

## 🌍 Malaysian Context

This system is specifically designed for Malaysian users with:
- **Local Emission Factors**: Malaysian-specific data for all categories
- **Regional Context**: Different factors for different Malaysian regions
- **Local Recommendations**: Culturally relevant suggestions
- **Malay Language Support**: Multilingual AI processing

## 🚀 Performance Features

- **Optimized Queries**: All database queries are optimized with proper indexing
- **Vector Search**: Fast semantic search using Cohere embeddings
- **Caching**: Intelligent caching for frequently accessed data
- **Batch Processing**: Efficient batch operations for data import
- **Connection Pooling**: Optimized database connection management

## 🔒 Security

- **Environment Variables**: All sensitive data in environment variables
- **Input Validation**: Comprehensive validation for all API inputs
- **SQL Injection Protection**: Parameterized queries throughout
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Error Handling**: Secure error messages without data exposure

## 📚 Additional Documentation

- **[Calculator API Guide](CALCULATOR_API_GUIDE.md)** - Detailed API documentation
- **[RAG API Documentation](RAG_API_DOCUMENTATION.md)** - Recommendation system guide
- **[Cohere Setup](COHERE_SETUP.md)** - AI embeddings configuration
- **[Groq Setup](GROQ_SETUP.md)** - LLM integration guide
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Vue Frontend Integration](VUE_FRONTEND_INTEGRATION_GUIDE.md)** - Frontend integration

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your `DATABASE_URL` in `.env`
   - Ensure PostgreSQL is running
   - Verify database credentials

2. **Cohere API Errors**
   - Verify `COHERE_API_KEY` in `.env`
   - Check API key validity
   - Ensure sufficient API credits

3. **Groq API Errors**
   - Verify `GROQ_API_KEY` in `.env`
   - Check API key validity
   - Ensure sufficient API credits

4. **Embeddings Not Generated**
   - Run `node scripts/populateEmbeddings.js`
   - Check Cohere API key and credits
   - Verify database connection

### Getting Help

- Check the logs for detailed error messages
- Run individual test scripts to isolate issues
- Verify all environment variables are set correctly
- Ensure all dependencies are installed

## ✅ Success Checklist

After setup, you should have:
- [ ] Server running on `https://gp-backend-iter2.vercel.app`
- [ ] Health check returning success
- [ ] 30 recommendations with embeddings
- [ ] 658 carbon emission factors
- [ ] All test scripts passing
- [ ] Web interfaces accessible
- [ ] API endpoints responding correctly

## 🎉 You're Ready!

Your GreenPulse backend is now fully operational with all features enabled. You can start building your frontend application or integrate with existing systems using the comprehensive API endpoints.
