# GreenPulse Backend API

A comprehensive carbon footprint calculator backend with AI-powered recommendations, built for Malaysian users. Features advanced RAG (Retrieval-Augmented Generation) system, multiple calculation categories, and intelligent emission factor management.

## 📋 Current Version: 3.0.0

**Latest Update**: September 26, 2025  
**Status**: Production Ready ✅  
**Deployment**: [Live on Vercel](https://gp-backend-iter2.vercel.app)

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
# Database Configuration (Required)
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# AI Services (Required for recommendations)
COHERE_API_KEY=your_cohere_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
API_PORT=3001
NODE_ENV=development

# Optional: Vercel deployment
VERCEL=1
```

**Note**: The server will start without AI services, but recommendation features will be disabled. Database connection is required for all functionality.

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

### 5. Verify Installation

Check if everything is working:

```bash
# Test basic health
curl http://localhost:3001/health

# Test database connection
curl http://localhost:3001/health/db

# Test all systems
curl http://localhost:3001/api/test-all-systems
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Check if the API is running
- `GET /health/db` - Check database connection status

### Carbon Footprint Calculations
- `POST /api/calculate/travel` - Calculate travel emissions
- `POST /api/calculate/household` - Calculate household emissions
- `POST /api/calculate/food` - Calculate food emissions
- `POST /api/calculate/shopping` - Calculate shopping emissions

### System Testing & Diagnostics
- `GET /api/test-db` - Test database connection
- `GET /api/test-schema` - Test schema imports
- `GET /api/test-travel-tables` - Test travel calculation tables
- `GET /api/test-all-systems` - Comprehensive system test

### AI-Powered Recommendations
- `POST /api/recommendations/generate` - Generate personalized recommendations
- `POST /api/recommendations/search` - Search recommendations by query
- `GET /api/recommendations/category/:category` - Get recommendations by category
- `GET /api/recommendations/random/:category` - Get random recommendations
- `POST /api/recommendations/track-interaction` - Track user interactions
- `GET /api/recommendations/health` - Check recommendation service status

### GTFS Public Transport Data
- `GET /api/gtfs/info` - Get GTFS API information
- `GET /api/gtfs/categories` - Get available Prasarana categories
- `GET /api/gtfs/health` - Check GTFS service health
- `GET /api/gtfs/files` - List downloaded GTFS files
- `POST /api/gtfs/download` - Download GTFS data for specific categories
- `POST /api/gtfs/download/category/:category` - Download single category
- `POST /api/gtfs/download/all` - Download all available categories
- `DELETE /api/gtfs/cleanup` - Clean up old GTFS files

### Emission Factors & Data
- `GET /api/emission-factors/food` - Get food emission factors
- `GET /api/emission-factors/shopping` - Get shopping emission factors
- `GET /api/emission-factors/vehicles` - Get vehicle emission factors
- `GET /api/emission-factors/public-transport` - Get public transport factors
- `GET /api/emission-factors/household` - Get household emission factors
- `GET /api/recommendations/emission-factors/:category` - Get emission factors by category

### Dropdown Data for Frontend
- `GET /api/food-dropdown/fruits-vegetables` - Food dropdown data
- `GET /api/food-dropdown/poultry-redmeats-seafood` - Meat/seafood dropdown
- `GET /api/food-dropdown/staples-grain` - Staple foods dropdown
- `GET /api/food-dropdown/processed-dairy` - Dairy products dropdown
- `GET /api/shopping-dropdown/groceries-beverages` - Groceries dropdown
- `GET /api/shopping-dropdown/home-garden-appliances-entertainment-general` - Home items dropdown
- `GET /api/shopping-dropdown/clothing-accessories-health-pharmacy` - Personal items dropdown

### AI Services
- `POST /api/cohere/test-embedding` - Test Cohere embeddings
- `POST /api/cohere/test-embedding-debug` - Test embeddings with debug info
- `POST /api/cohere/test-recommendation-embedding` - Test recommendation embeddings
- `GET /api/cohere/health` - Check Cohere service status
- `GET /api/groq/test` - Test Groq service
- `POST /api/groq/generate-text` - Generate text using Groq
- `POST /api/groq/generate-summary` - Generate summaries
- `POST /api/groq/generate-recommendations` - Generate recommendations
- `POST /api/groq/update-models` - Update available models
- `GET /api/groq/models` - Get available models
- `GET /api/groq/health` - Check Groq service status

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

### Available Test Files
- `test/test-recommendations.js` - Test recommendation API
- `test/test-cohere.js` - Test Cohere integration
- `test/test-groq.js` - Test Groq integration
- `test/test-deployment.js` - Test deployment endpoints
- `test/test-all-calculators.js` - Test all calculator endpoints
- `test/test-all-categories.js` - Test all category endpoints
- `test/test-food-calculator.js` - Test food calculator specifically
- `test/test-household-calculator.js` - Test household calculator
- `test/test-shopping-calculator.js` - Test shopping calculator
- `test/test-travel-calculator.js` - Test travel calculator
- `test/test-routes.js` - Test all routes
- `test/test-detailed-frequencies.js` - Test detailed frequency data
- `test/test-dropdowns.js` - Test dropdown endpoints
- `test/test-gtfs.js` - Test GTFS public transport data functionality

### Run Tests
```bash
# Test recommendation API
node test/test-recommendations.js

# Test Cohere integration
node test/test-cohere.js

# Test Groq integration
node test/test-groq.js

# Test deployment
node test/test-deployment.js

# Test all calculators
node test/test-all-calculators.js

# Test all categories
node test/test-all-categories.js

# Test specific calculators
node test/test-food-calculator.js
node test/test-household-calculator.js
node test/test-shopping-calculator.js
node test/test-travel-calculator.js

# Test dropdown endpoints
node test/test-dropdowns.js

# Test GTFS functionality
node test/test-gtfs.js
```

### Test Individual Services
```bash
# Test recommendation generation
curl -X POST https://gp-backend-iter2.vercel.app/api/recommendations/generate \
  -H "Content-Type: application/json" \
  -d '{"category": "travel", "emissions": 45.2, "calculationData": {...}}'

# Test recommendation search
curl -X POST https://gp-backend-iter2.vercel.app/api/recommendations/search \
  -H "Content-Type: application/json" \
  -d '{"query": "reduce car emissions", "category": "travel"}'

# Test system health
curl https://gp-backend-iter2.vercel.app/health
curl https://gp-backend-iter2.vercel.app/health/db
```

## 📚 Documentation

- **[Complete Setup Guide](guides/COMPLETE_SETUP_GUIDE.md)** - 🚀 **START HERE** - Complete setup in 5 minutes
- **[Calculator API Guide](guides/CALCULATOR_API_GUIDE.md)** - Detailed API documentation
- **[RAG API Documentation](guides/RAG_API_DOCUMENTATION.md)** - Recommendation system guide
- **[GTFS API Documentation](guides/GTFS_API_DOCUMENTATION.md)** - Public transport data guide
- **[Cohere Setup](guides/COHERE_SETUP.md)** - AI embeddings configuration
- **[Groq Setup](guides/GROQ_SETUP.md)** - LLM integration guide
- **[Deployment Guide](guides/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Vue Frontend Integration](guides/VUE_FRONTEND_INTEGRATION_GUIDE.md)** - Frontend integration

## 🔧 Scripts

### Available NPM Scripts
```bash
# Development
npm run dev          # Start development server with nodemon
npm start           # Start production server

# Database Management
npm run migrate     # Run database migrations
npm run db:generate # Generate Drizzle migrations
npm run db:migrate  # Apply Drizzle migrations
npm run db:studio   # Open Drizzle Studio

# Data Setup & Management
npm run setup-rag              # Set up recommendation system tables
npm run populate-embeddings    # Generate AI embeddings
npm run populate-emission-factors # Populate emission factors
npm run import-csv-quoted      # Import CSV data with advanced parsing
npm run import-food-consumption # Import food consumption data
npm run clear-data            # Clear database data
```

### Database Management Scripts
- `scripts/setupRAGTables.js` - Set up recommendation system tables
- `scripts/populateEmbeddings.js` - Generate AI embeddings
- `scripts/populateEmissionFactors.js` - Populate emission factors
- `scripts/import-csv-quoted.js` - Import CSV data with advanced parsing
- `scripts/import-food-consumption.js` - Import food consumption data
- `scripts/clear-data.js` - Clear database data
- `scripts/migrate.js` - Database migration script
- `scripts/downloadGTFS.js` - Download GTFS public transport data

### Complete System Setup
```bash
# 1. Set up RAG tables and populate data
npm run setup-rag
npm run populate-embeddings
npm run populate-emission-factors

# 2. Import CSV data
npm run import-csv-quoted
npm run import-food-consumption

# 3. Start development server
npm run dev
```

## 🚀 Deployment

### Production Deployment (Vercel)
The application is deployed on Vercel with the following configuration:

- **Production URL**: `https://gp-backend-iter2.vercel.app`
- **Frontend URL**: `https://greenpulse-frontend-v.vercel.app`
- **Configuration**: `vercel.json` with Node.js runtime
- **Environment**: Production environment with optimized settings

### Environment Variables for Production
```env
# Required for production
DATABASE_URL=postgresql://username:password@hostname:port/database_name
COHERE_API_KEY=your_cohere_api_key_here
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=production
API_PORT=3001
```

### Deployment Commands
```bash
# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs
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

## 📁 Project Structure

```
greenpulse-backend-iter2/
├── config/                 # Database configuration
├── data/                   # CSV data files
├── db/                     # Database schema definitions
├── drizzle/               # Database migrations
├── guides/                # Documentation guides
├── public/                # Static files and test pages
├── routes/                # API route handlers
├── scripts/               # Database setup and data import scripts
├── services/              # Business logic services
├── test/                  # Test files
├── server.js              # Main application entry point
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel deployment configuration
└── README.md             # This file
```

## 🔒 Security

- **Environment Variables**: All sensitive data in environment variables
- **Input Validation**: Comprehensive validation for all API inputs
- **SQL Injection Protection**: Parameterized queries throughout
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Error Handling**: Secure error messages without data exposure
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Helmet Security**: Security headers and CSP policies

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database URL format
   echo $DATABASE_URL
   
   # Test connection
   curl http://localhost:3001/health/db
   ```

2. **AI Services Not Working**
   ```bash
   # Check API keys
   echo $COHERE_API_KEY
   echo $GROQ_API_KEY
   
   # Test services
   curl http://localhost:3001/api/cohere/health
   curl http://localhost:3001/api/groq/health
   ```

3. **Missing Data**
   ```bash
   # Re-run setup scripts
   npm run setup-rag
   npm run populate-embeddings
   npm run populate-emission-factors
   ```

### Getting Help

- Check the [Complete Setup Guide](guides/COMPLETE_SETUP_GUIDE.md)
- Review the [API Documentation](guides/CALCULATOR_API_GUIDE.md)
- Run the test suite: `node test/test-all-systems.js`
- Check deployment logs: `vercel logs`
