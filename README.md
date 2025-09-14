# GreenPulse Backend API

A comprehensive carbon footprint calculator backend with AI-powered recommendations, built for Malaysian users. Features advanced RAG (Retrieval-Augmented Generation) system, multiple calculation categories, and intelligent emission factor management.

## 🌟 Features

- **Multi-Category Carbon Calculations**: Travel, Household, Food, Shopping
- **AI-Powered Recommendations**: Smart suggestions using Cohere embeddings and Groq LLM
- **Malaysian Context**: Localized emission factors and recommendations
- **Vector Search**: Semantic search for relevant recommendations
- **Real-time API**: RESTful endpoints for all functionality
- **PostgreSQL Optimized**: High-performance database with proper indexing

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file with the following variables:

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

Apply the optimized PostgreSQL schema and populate data:

```bash
# Set up RAG tables and seed data
node scripts/setupRAGTables.js

# Generate embeddings for recommendations
node scripts/populateEmbeddings.js
```

### 4. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The API will be available at `http://localhost:3001`

## 📡 API Endpoints

### Health Check
- `GET /health` - Check if the API is running

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

### AI Services
- `POST /api/cohere/test-embedding` - Test Cohere embeddings
- `POST /api/groq/chat` - Test Groq LLM integration

## 🗄️ Database Schema

### Core Tables
- **`recommendations_kb`** - AI recommendation knowledge base with embeddings
- **`carbon_emission_factors`** - Unified emission factors from all categories
- **`food_categories`** - Food category hierarchy
- **`food_subcategories`** - Food subcategories
- **`food_entities`** - Specific food items
- **`food_emission_factors`** - Food-specific emission factors
- **`shopping_categories`** - Shopping category hierarchy
- **`shopping_subcategories`** - Shopping subcategories
- **`shopping_entities`** - Shopping items/services
- **`shopping_emission_factors`** - Shopping-specific emission factors
- **`vehicle_category`** - Vehicle type classifications
- **`vehicle_size`** - Vehicle size specifications
- **`vehicle_emission_factor`** - Vehicle emission factors
- **`fuel_type`** - Fuel type references
- **`public_transport`** - Public transport emission factors
- **`household_factor_category`** - Household factor categories
- **`household_factors`** - Household emission factors
- **`region`** - Geographic regions

### Key Features
- **Optimized PostgreSQL Schema** with proper indexing
- **Vector Embeddings** for semantic search
- **Malaysian Context** in all emission factors
- **Referential Integrity** with foreign key constraints
- **Performance Indexes** on frequently queried columns

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

### Test Individual Services
```bash
# Test recommendation generation
curl -X POST https://gp-backend-iter2.vercel.app/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -d '{"category": "travel", "totalEmissions": 45.2, "calculationData": {...}}'

# Test recommendation search
curl -X POST https://gp-backend-iter2.vercel.app/api/recommendations/search \
  -H "Content-Type: application/json" \
  -d '{"query": "reduce car emissions", "category": "travel"}'
```

## 📚 Documentation

- **[Complete Setup Guide](guides/COMPLETE_SETUP_GUIDE.md)** - 🚀 **START HERE** - Complete setup in 5 minutes
- **[Calculator API Guide](guides/CALCULATOR_API_GUIDE.md)** - Detailed API documentation
- **[RAG API Documentation](guides/RAG_API_DOCUMENTATION.md)** - Recommendation system guide
- **[Cohere Setup](guides/COHERE_SETUP.md)** - AI embeddings configuration
- **[Groq Setup](guides/GROQ_SETUP.md)** - LLM integration guide
- **[Deployment Guide](guides/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Vue Frontend Integration](guides/VUE_FRONTEND_INTEGRATION_GUIDE.md)** - Frontend integration

## 🔧 Scripts

### Database Management
- `scripts/setupRAGTables.js` - Set up recommendation system tables
- `scripts/populateEmbeddings.js` - Generate AI embeddings
- `scripts/import-csv-quoted.js` - Import CSV data with advanced parsing
- `scripts/clear-data.js` - Clear database data

### Data Population
```bash
# Set up complete system
node scripts/setupRAGTables.js
node scripts/populateEmbeddings.js

# Import CSV data
node scripts/import-csv-quoted.js
```

## 🌍 Malaysian Context

This backend is specifically designed for Malaysian users with:
- **Local Emission Factors**: Malaysian-specific data for all categories
- **Regional Context**: Different factors for different Malaysian regions
- **Local Recommendations**: Culturally relevant suggestions
- **Malay Language Support**: Multilingual AI processing

## 🚀 Performance

- **Optimized Queries**: All database queries are optimized with proper indexing
- **Vector Search**: Fast semantic search using Cohere embeddings
- **Caching**: Intelligent caching for frequently accessed data
- **Batch Processing**: Efficient batch operations for data import
- **Connection Pooling**: Optimized database connection management

## 📊 Data Statistics

- **658 Carbon Emission Factors** across all categories
- **30 AI Recommendations** with vector embeddings
- **413 Shopping Entities** with emission data
- **211 Food Items** with detailed emission factors
- **24 Vehicle Types** with size and fuel variations
- **10 Household Factors** across different regions

## 🔒 Security

- **Environment Variables**: All sensitive data in environment variables
- **Input Validation**: Comprehensive validation for all API inputs
- **SQL Injection Protection**: Parameterized queries throughout
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Error Handling**: Secure error messages without data exposure
