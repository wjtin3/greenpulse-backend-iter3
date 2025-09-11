# Groq LLM Setup Guide

This guide explains how to set up and use Groq LLM in the GreenPulse backend.

## 🚀 Quick Start

### 1. Get Groq API Key
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for an account
3. Get your API key from the dashboard

### 2. Set Environment Variable
Add to your `.env` file:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Test the Setup
Run the test script:
```bash
node test-groq.js
```

## 📡 API Endpoints

### Health Check
```bash
GET /api/groq/health
```

### General Text Generation
```bash
POST /api/groq/generate-text
Content-Type: application/json

{
  "prompt": "Tell me about carbon footprint reduction in Malaysia",
  "temperature": 0.7,
  "max_tokens": 1000,
  "systemPrompt": "You are a helpful environmental consultant."
}
```

### Carbon Footprint Summary
```bash
POST /api/groq/generate-summary
Content-Type: application/json

{
  "category": "travel",
  "emissions": 45.2,
  "userData": {
    "distance": 100,
    "vehicleType": "car",
    "fuelType": "petrol"
  }
}
```

### Generate Recommendations
```bash
POST /api/groq/generate-recommendations
Content-Type: application/json

{
  "category": "travel",
  "userEmissions": 45.2,
  "userData": {
    "privateTransport": [{"vehicleType": "car", "distance": 100}]
  },
  "similarRecommendations": [
    {
      "title": "Use public transport",
      "content": "Public transport reduces emissions",
      "impact_level": "high",
      "difficulty": "easy",
      "cost_impact": "saves_money"
    }
  ]
}
```

### Update Model Configuration
```bash
POST /api/groq/update-models
Content-Type: application/json

{
  "primaryModel": "openai/gpt-oss-120b",
  "backupModel": "openai/gpt-oss-20b"
}
```

### Get Current Models
```bash
GET /api/groq/models
```

## 🔧 Service Methods

### Basic Usage
```javascript
import { groqService } from './services/groqService.js';

// Generate general text
const response = await groqService.generateText("Your prompt here", {
  temperature: 0.7,
  max_tokens: 1000,
  systemPrompt: "You are a helpful assistant."
});

// Generate carbon footprint summary
const summary = await groqService.generateFootprintSummary(
  'travel', 
  45.2, 
  { distance: 100, vehicleType: 'car' }
);

// Generate recommendations
const recommendations = await groqService.generateRecommendations({
  category: 'travel',
  userEmissions: 45.2,
  userData: { /* user data */ },
  similarRecommendations: [ /* similar recs */ ]
});
```

## 🤖 Model Configuration

### Default Models
- **Primary**: `openai/gpt-oss-120b` (larger, more capable)
- **Backup**: `openai/gpt-oss-20b` (smaller, faster)

### Available Models
- `openai/gpt-oss-120b` - Large model with high capability
- `openai/gpt-oss-20b` - Medium model with good performance
- `llama3-70b-8192` - Llama 3 70B model
- `llama3-8b-8192` - Llama 3 8B model

### Fallback System
The service automatically falls back to the backup model if the primary model fails, ensuring reliability.

## 🧪 Testing

### Run All Tests
```bash
node test-groq.js
```

### Test Individual Endpoints
```bash
# Health check
curl http://localhost:3001/api/groq/health

# General text generation
curl -X POST http://localhost:3001/api/groq/generate-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how are you?", "temperature": 0.7}'

# Carbon footprint summary
curl -X POST http://localhost:3001/api/groq/generate-summary \
  -H "Content-Type: application/json" \
  -d '{"category": "travel", "emissions": 45.2, "userData": {"distance": 100}}'
```

## 🌐 Web Interface

Access the Groq test interface at: **http://localhost:3001/groq-test.html**

### Features:
- **Health Check** - Verify service status
- **General Text Generation** - Test basic LLM functionality
- **Carbon Footprint Summary** - Generate contextual summaries
- **Recommendations** - Test full recommendation generation
- **Model Configuration** - Update model settings

## 📊 Response Formats

### General Text Response
```json
{
  "success": true,
  "prompt": "Your prompt",
  "response": "Generated text response",
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000,
    "systemPrompt": "System prompt used"
  }
}
```

### Summary Response
```json
{
  "success": true,
  "category": "travel",
  "emissions": 45.2,
  "summary": "Generated summary text"
}
```

### Recommendations Response
```json
{
  "success": true,
  "context": {
    "category": "travel",
    "userEmissions": 45.2,
    "userData": { /* user data */ },
    "similarRecommendations": [ /* similar recs */ ]
  },
  "recommendations": "Generated recommendations text"
}
```

## ⚠️ Error Handling

Common errors and solutions:

### Missing API Key
```
Error: GROQ_API_KEY environment variable is required
```
**Solution**: Add your Groq API key to the `.env` file

### Invalid API Key
```
Error: Invalid API key
```
**Solution**: Check your API key is correct and active

### Rate Limiting
```
Error: Rate limit exceeded
```
**Solution**: Wait a moment and try again, or upgrade your Groq plan

### Model Not Available
```
Error: Model not found
```
**Solution**: Check the model name is correct and available

## 🎯 Malaysian Context

The service is specifically configured for Malaysian context:

### Travel Recommendations
- Malaysian public transport (LRT, MRT, KTM, buses)
- Local traffic patterns and peak hours
- Ride-sharing and carpooling options

### Household Recommendations
- Malaysian climate considerations (tropical, high humidity)
- Local utility providers (TNB, water authorities)
- Energy-efficient appliances available in Malaysia

### Food Recommendations
- Malaysian cuisine and local ingredients
- Local food production and seasonal availability
- Traditional vs modern cooking methods

### Shopping Recommendations
- Local manufacturing and imports
- Malaysian brands and sustainable alternatives
- Local e-commerce and delivery options

## 🚀 Next Steps

1. ✅ **Groq LLM is now set up**
2. 🔄 **Next**: Integrate with Cohere embeddings for RAG
3. 🔄 **Next**: Create vector search functionality
4. 🔄 **Next**: Build complete recommendation system

## 📚 Resources

- [Groq Console](https://console.groq.com/)
- [Groq API Documentation](https://console.groq.com/docs)
- [Available Models](https://console.groq.com/docs/models)
- [Rate Limits](https://console.groq.com/docs/rate-limits)
