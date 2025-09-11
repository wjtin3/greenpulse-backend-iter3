# 🧪 Cohere Embeddings Test Interface

A simple web interface to test Cohere embeddings functionality in the GreenPulse backend.

## 🚀 Quick Start

### 1. Setup
```bash
# Run the setup script
node setup-cohere.js

# Make sure you have a Cohere API key in your .env file
COHERE_API_KEY=your_actual_api_key_here
```

### 2. Start the Server
```bash
npm run dev
```

### 3. Open the Test Interface
Open your browser and go to: **http://localhost:3001**

## 🎯 Test Features

### 📝 Basic Embedding Test
- Generate embeddings for any text
- Choose between "search_document" or "search_query" input types
- See embedding dimensions and first 5 values

### 🔍 Debug Embedding Test
- Same as basic test but with detailed debug information
- Shows API response time, tokens used, model info
- Perfect for troubleshooting and understanding the API

### 💡 Recommendation Embedding Test
- Test embeddings for recommendation content
- Includes title, content, category, context, and tags
- Simulates real-world recommendation scenarios

### 🏥 Health Check
- Verify the Cohere service is working
- Quick test to ensure API connectivity
- Shows basic service status

## 🎨 Interface Features

- **Responsive Design**: Works on desktop and mobile
- **Real-time Testing**: Instant API calls and responses
- **Error Handling**: Clear error messages and troubleshooting
- **Loading States**: Visual feedback during API calls
- **Debug Information**: Detailed technical information
- **Pre-filled Examples**: Sample data to get started quickly

## 📊 What You'll See

### Successful Response
```json
{
  "success": true,
  "text": "Your input text",
  "type": "search_document",
  "embedding": {
    "dimensions": 1024,
    "firstFiveValues": ["0.1234", "0.5678", "0.9012", "0.3456", "0.7890"]
  }
}
```

### Debug Information
```json
{
  "debug": {
    "inputText": "Your text",
    "model": "embed-multilingual-v3.0",
    "inputType": "search_document",
    "embeddingDimension": 1024,
    "tokensUsed": 15,
    "responseTime": 250,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "apiVersion": "2024-01-01"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### "COHERE_API_KEY environment variable is required"
- **Solution**: Add your Cohere API key to the `.env` file
- **Format**: `COHERE_API_KEY=your_actual_api_key_here`

#### "Request failed: Failed to fetch"
- **Solution**: Make sure the server is running (`npm run dev`)
- **Check**: Server should be running on port 3001

#### "Invalid API key" or "Rate limit exceeded"
- **Solution**: Check your Cohere API key is correct and active
- **Check**: Verify you haven't exceeded your API limits

#### CORS Errors
- **Solution**: The server is configured to allow localhost requests
- **Check**: Make sure you're accessing `http://localhost:3001`

## 🧪 Manual Testing

You can also test the API endpoints directly:

### Health Check
```bash
curl http://localhost:3001/api/cohere/health
```

### Basic Embedding
```bash
curl -X POST http://localhost:3001/api/cohere/test-embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "Test text", "type": "search_document"}'
```

### Debug Embedding
```bash
curl -X POST http://localhost:3001/api/cohere/test-embedding-debug \
  -H "Content-Type: application/json" \
  -d '{"text": "Debug test", "type": "search_query"}'
```

### Recommendation Embedding
```bash
curl -X POST http://localhost:3001/api/cohere/test-recommendation-embedding \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Recommendation",
    "content": "This is a test recommendation",
    "category": "travel",
    "context": "Test context",
    "tags": ["test", "example"]
  }'
```

## 📈 Expected Results

- **Embedding Dimensions**: 1024 (Cohere's embed-multilingual-v3.0 model)
- **Response Time**: 200-500ms (depending on text length)
- **Tokens Used**: Varies based on input text length
- **Model**: embed-multilingual-v3.0
- **API Version**: Current Cohere API version

## 🎯 Next Steps

Once you've tested the embeddings:

1. ✅ **Cohere embeddings are working**
2. 🔄 **Next**: Set up vector search with pgvector
3. 🔄 **Next**: Create recommendation knowledge base
4. 🔄 **Next**: Integrate with carbon footprint calculations

## 🆘 Need Help?

- Check the console for detailed error messages
- Verify your Cohere API key is correct
- Make sure the server is running on port 3001
- Check the `COHERE_SETUP.md` file for detailed setup instructions
