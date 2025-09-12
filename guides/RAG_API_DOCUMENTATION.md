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
http://localhost:3001/api
```

### Production URL
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

### Generate Recommendations

**Endpoint**: `POST /recommendations/generate`

**Description**: Generate personalized carbon footprint recommendations using RAG (Retrieval-Augmented Generation).

**Request Body**:
```javascript
{
  "category": "travel|household|food|shopping",
  "totalEmissions": 25.5, // kg CO2e
  "calculationData": {
    // Category-specific data (see Data Structures section)
  }
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

**Example Request**:
```javascript
// Travel recommendations
const response = await fetch('/api/recommendations/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'travel',
    totalEmissions: 25.5,
    calculationData: {
      privateTransport: [{
        vehicleType: 'car',
        distance: 50,
        fuelType: 'petrol',
        passengers: 1
      }]
    }
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

### Get Popular Recommendations

**Endpoint**: `GET /recommendations/popular/:category`

**Description**: Get random recommendations (no user tracking).

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
      "vehicleType": "car|motorcycle|truck",
      "distance": 50, // km
      "fuelType": "petrol|diesel|electric",
      "passengers": 1,
      "fuelEfficiency": 12 // km/liter (optional)
    }
  ],
  "publicTransport": [
    {
      "transportType": "bus|train|lrt|mrt",
      "distance": 20, // km
      "frequency": "daily|weekly|monthly"
    }
  ],
  "flights": [
    {
      "origin": "KUL",
      "destination": "SIN",
      "class": "economy|business|first",
      "passengers": 1
    }
  ]
}
```

### Household Calculator Data

```javascript
{
  "electricity": {
    "monthlyKWh": 300,
    "provider": "TNB|other",
    "renewablePercentage": 0 // 0-100
  },
  "water": {
    "monthlyCubicMeters": 15,
    "hasWaterHeater": true,
    "hasSwimmingPool": false
  },
  "gas": {
    "monthlyCubicMeters": 20,
    "type": "natural_gas|lpg"
  },
  "waste": {
    "weeklyKg": 10,
    "recyclingPercentage": 30 // 0-100
  }
}
```

### Food Calculator Data

```javascript
{
  "meat": {
    "beef": { "weeklyKg": 0.5 },
    "pork": { "weeklyKg": 0.3 },
    "chicken": { "weeklyKg": 1.0 },
    "fish": { "weeklyKg": 0.8 }
  },
  "dairy": {
    "milk": { "weeklyLiters": 2 },
    "cheese": { "weeklyKg": 0.2 },
    "yogurt": { "weeklyKg": 0.5 }
  },
  "produce": {
    "localPercentage": 70, // 0-100
    "organicPercentage": 20, // 0-100
    "weeklyKg": 5
  },
  "habits": {
    "eatingOutFrequency": "daily|weekly|monthly|rarely",
    "foodWastePercentage": 10 // 0-100
  }
}
```

### Shopping Calculator Data

```javascript
{
  "clothing": {
    "monthlySpend": 200, // RM
    "secondHandPercentage": 20, // 0-100
    "fastFashionPercentage": 60 // 0-100
  },
  "electronics": {
    "monthlySpend": 150, // RM
    "averageLifespan": 3, // years
    "repairFrequency": "frequently|sometimes|rarely|never"
  },
  "general": {
    "monthlySpend": 300, // RM
    "onlineShoppingPercentage": 40, // 0-100
    "packagingWaste": "low|moderate|high"
  },
  "homeGoods": {
    "monthlySpend": 100, // RM
    "energyEfficientPercentage": 30 // 0-100
  }
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
curl http://localhost:3001/api/recommendations/health
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
DATABASE_URL=postgresql://your_username:your_password@your_host:5432/your_database
COHERE_API_KEY=your_cohere_api_key_here
GROQ_API_KEY=your_groq_api_key_here
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
