# 🌱 GreenPulse RAG System API Documentation

Complete API reference for the GreenPulse RAG recommendation system.

## 📋 Table of Contents

1. [Base Configuration](#base-configuration)
2. [Recommendations API](#recommendations-api)
3. [Cohere API](#cohere-api)
4. [Groq API](#groq-api)
5. [Data Structures](#data-structures)
6. [Error Handling](#error-handling)
7. [Rate Limits](#rate-limits)

## 🔧 Base Configuration

### Base URL
```
https://gp-backend-iter2.vercel.app/api
```

### Headers
```javascript
{
  "Content-Type": "application/json"
}
```

### Timeout
- **Recommendations**: 30 seconds (AI processing time)
- **Other endpoints**: 10 seconds

## 🎯 Recommendations API

### API Design Philosophy

The recommendations API is designed with **simplicity first** - you only need two core parameters to get personalized recommendations:

- **`category`**: The type of carbon footprint (travel/household/food/shopping)
- **`emissions`**: The calculated emission value in kg CO₂

Additional `calculationData` is optional and provides more context for better recommendations, but the system works perfectly with just the core parameters.

### Generate Recommendations

**Endpoint**: `POST /recommendations/generate`

**Description**: Generate personalized carbon footprint recommendations using RAG (Retrieval-Augmented Generation).

**Request Body**:
```javascript
{
  "category": "travel|household|food|shopping",
  "emissions": 25.5, // kg CO2e - REQUIRED
  "calculationData": {
    // Category-specific data (see Data Structures section) - OPTIONAL
  },
  "sessionId": "optional_session_id", // OPTIONAL - auto-generated if not provided
  "debugMode": false // OPTIONAL - enables debug information
}
```

**Response**:
```javascript
{
  "success": true,
  "data": {
    "summary": "Your 50 km car trip generated about 25.5 kg CO₂...",
    "recommendations": "🌱 **Recommendations for Your Travel**\n\n🚗 **Switch to Public Transport**\n..."
  }
}
```

**Example Requests**:

```javascript
// Minimal usage (category + emissions only)
const response = await fetch('/api/recommendations/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'travel',
    emissions: 25.5
  })
})

// With additional context data
const response = await fetch('/api/recommendations/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'travel',
    emissions: 25.5,
    calculationData: {
      privateTransport: [{
        vehicleType: 'car',
        distance: 50,
        fuelType: 'petrol',
        vehicleSize: 'medium'
      }]
    },
    debugMode: true
  })
})
```

### Search Recommendations

**Endpoint**: `POST /recommendations/search`

**Description**: Search recommendations using vector similarity.

**Request Body**:
```javascript
{
  "query": "reduce electricity bill",
  "category": "household", // optional
  "limit": 5 // optional, default: 10
}
```

**Response**:
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Switch to LED Bulbs",
      "content": "Replace all incandescent and CFL bulbs...",
      "context": "LED bulbs are widely available in Malaysia...",
      "impact_level": "medium",
      "difficulty": "easy",
      "cost_impact": "saves_money",
      "tags": ["LED", "lighting", "energy_efficiency"],
      "similarity": 0.85
    }
  ]
}
```

### Get Recommendations by Category

**Endpoint**: `GET /recommendations/category/:category`

**Description**: Get recommendations filtered by category.

**Parameters**:
- `category`: travel|household|food|shopping
- `limit`: number (optional, default: 10)

**Response**:
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Use Public Transport in KL",
      "content": "Switch to LRT, MRT, or buses...",
      "category": "travel",
      "impact_level": "high",
      "difficulty": "easy",
      "cost_impact": "saves_money",
      "tags": ["public_transport", "commuting", "KL"]
    }
  ]
}
```

### Get Random Recommendations

**Endpoint**: `GET /recommendations/random/:category`

**Description**: Get random recommendations.

**Parameters**:
- `category`: travel|household|food|shopping
- `limit`: number (optional, default: 5)

**Response**: Same as category endpoint

### Get Emission Factors

**Endpoint**: `GET /recommendations/emission-factors/:category`

**Description**: Get emission factors for a specific category.

**Parameters**:
- `category`: travel|household|food|shopping

**Response**:
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category": "travel",
      "subcategory": "car",
      "name": "Car - Small (Petrol)",
      "emission_factor": 0.192,
      "unit": "kg CO2e/km",
      "description": "Emission factor for small cars using petrol",
      "malaysian_context": "Malaysian small cars typically use petrol fuel..."
    }
  ]
}
```

### Health Check

**Endpoint**: `GET /recommendations/health`

**Description**: Check if the recommendation service is working.

**Response**:
```javascript
{
  "success": true,
  "status": "Recommendation service is working",
  "testResults": 1
}
```

## 🤖 Cohere API

### Generate Embedding

**Endpoint**: `POST /cohere/embed`

**Description**: Generate vector embeddings for text.

**Request Body**:
```javascript
{
  "text": "Switch to LED bulbs for energy efficiency",
  "type": "recommendation" // recommendation|query
}
```

**Response**:
```javascript
{
  "success": true,
  "embedding": [0.013832092, 0.011764526, ...], // 1024 dimensions
  "dimensions": 1024
}
```

### Generate Text

**Endpoint**: `POST /cohere/generate`

**Description**: Generate text using Cohere's language model.

**Request Body**:
```javascript
{
  "prompt": "Write a summary about carbon footprint reduction",
  "max_tokens": 100,
  "temperature": 0.7
}
```

**Response**:
```javascript
{
  "success": true,
  "text": "Carbon footprint reduction is essential for...",
  "usage": {
    "tokens": 45
  }
}
```

## 🚀 Groq API

### Generate Text

**Endpoint**: `POST /groq/generate-text`

**Description**: Generate text using Groq's LLM.

**Request Body**:
```javascript
{
  "prompt": "Explain how to reduce carbon footprint",
  "max_tokens": 1000,
  "temperature": 0.7,
  "model": "openai/gpt-oss-120b" // optional
}
```

**Response**:
```javascript
{
  "success": true,
  "text": "Here are effective ways to reduce your carbon footprint...",
  "model": "openai/gpt-oss-120b",
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

### Generate Summary

**Endpoint**: `POST /groq/generate-summary`

**Description**: Generate a summary of carbon footprint data.

**Request Body**:
```javascript
{
  "data": {
    "category": "travel",
    "totalEmissions": 25.5,
    "breakdown": {
      "car": 20.0,
      "bus": 5.5
    }
  },
  "max_tokens": 500
}
```

**Response**:
```javascript
{
  "success": true,
  "summary": "Your travel activities generated 25.5 kg CO₂...",
  "model": "openai/gpt-oss-120b"
}
```

## 📊 Data Structures

### Travel Calculator Data

```javascript
{
  "privateTransport": [
    {
      "vehicleType": "car|motorbike", // Only Car and Motorbike supported
      "distance": 50, // km
      "fuelType": "diesel|petrol|hybrid|phev|bev|electric", // From fuel_type.csv
      "vehicleSize": "small|medium|large|average" // From vehicle_size.csv
    }
  ],
  "publicTransport": [
    {
      "transportType": "bus|mrt|lrt|monorail|ktm|average_train", // From public_transport.csv
      "distance": 20 // km
    }
  ]
}
```

### Household Calculator Data

```javascript
{
  "numberOfPeople": 4, // Number of people in household
  "electricityUsage": 300, // Monthly kWh usage
  "waterUsage": 15, // Monthly cubic meters
  "wasteDisposal": 10 // Weekly kg of waste
}
```

### Food Calculator Data

```javascript
{
  "foodItems": [
    {
      "foodType": "chicken|beef|rice|vegetables|...", // From food_entities.csv
      "quantity": 2 // Amount consumed
    }
  ]
}
```

### Shopping Calculator Data

```javascript
{
  "categories": [
    {
      "name": "clothing|electronics|food|...", // From shopping_entities.csv
      "spending": 200 // Monthly spending in RM
    }
  ],
  "spending": 700 // Total monthly spending in RM
}
```

## ⚠️ Error Handling

### Error Response Format

```javascript
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    // Additional error information
  }
}
```

### Common Error Types

#### API Errors (4xx, 5xx)
```javascript
{
  "success": false,
  "error": "API_ERROR",
  "message": "Invalid request data",
  "status": 400,
  "details": {
    "field": "category",
    "issue": "Invalid category value"
  }
}
```

#### Network Errors
```javascript
{
  "success": false,
  "error": "NETWORK_ERROR",
  "message": "Unable to connect to recommendation service",
  "status": 0
}
```

#### AI Service Errors
```javascript
{
  "success": false,
  "error": "AI_SERVICE_ERROR",
  "message": "Cohere API rate limit exceeded",
  "status": 429,
  "details": {
    "service": "cohere",
    "retryAfter": 60
  }
}
```

### Error Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid data |
| 401 | Unauthorized - Missing API key |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## 🚦 Rate Limits

### Cohere API
- **Free Tier**: 100 requests/minute
- **Paid Tier**: 1000 requests/minute

### Groq API
- **Free Tier**: 30 requests/minute
- **Paid Tier**: 1000 requests/minute

### Recommendation Generation
- **Rate Limit**: 10 requests/minute per IP
- **Burst Limit**: 5 requests in 10 seconds

### Rate Limit Headers
```javascript
{
  "X-RateLimit-Limit": "10",
  "X-RateLimit-Remaining": "7",
  "X-RateLimit-Reset": "1640995200"
}
```

## 🔒 Security

### API Keys
- Store API keys in environment variables
- Never expose keys in client-side code
- Rotate keys regularly

### CORS
- Configured for localhost:3000 (development)
- Update for production domains

### Content Security Policy
- Configured to allow necessary scripts
- Blocks inline scripts by default

## 📈 Monitoring

### Health Check
Monitor the health endpoint regularly:
```bash
curl https://gp-backend-iter2.vercel.app/api/recommendations/health
```

### Logs
Check server logs for:
- API request/response times
- Error rates
- AI service usage

### Metrics
Track:
- Request volume by endpoint
- Response times
- Error rates by type
- AI service usage

## 🚀 Production Deployment

### Environment Variables
```bash
# Production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
COHERE_API_KEY=your_production_key
GROQ_API_KEY=your_production_key
API_PORT=3001
```

### Performance Optimization
- Enable response caching
- Use connection pooling
- Monitor memory usage
- Set up load balancing

### Scaling Considerations
- Database connection limits
- AI service rate limits
- Memory usage for embeddings
- Response time optimization

---

For more information, see the [Vue Frontend Integration Guide](./VUE_FRONTEND_INTEGRATION_GUIDE.md) and [RAG Setup Guide](./RAG_SETUP_GUIDE.md).
