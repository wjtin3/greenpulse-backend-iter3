# 🧪 GreenPulse Recommendations API - Postman Test Cases

Complete collection of JSON test cases for testing the GreenPulse Recommendations API in Postman.

## 🔧 Base Configuration

### Base URL
```
https://gp-backend-iter2.vercel.app/api
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Timeout Settings
- **Recommendations**: 30 seconds (AI processing time)
- **Other endpoints**: 10 seconds

---

## 1. 🎯 Generate Recommendations (Full Data)

### Method: `POST`
### Endpoint: `/recommendations/generate`

#### Travel Recommendations
```json
{
  "category": "travel",
  "emissions": 45.2,
  "calculationData": {
    "privateTransport": [
      {
        "vehicleType": "car",
        "distance": 50,
        "fuelType": "petrol",
        "vehicleSize": "medium"
      }
    ],
    "publicTransport": [
      {
        "transportType": "bus",
        "distance": 20
      }
    ]
  },
  "debugMode": true
}
```

#### Household Recommendations
```json
{
  "category": "household",
  "emissions": 120.5,
  "calculationData": {
    "numberOfPeople": 4,
    "electricityUsage": 350,
    "waterUsage": 800,
    "wasteDisposal": 15
  },
  "debugMode": true
}
```

#### Food Recommendations
```json
{
  "category": "food",
  "emissions": 85.3,
  "calculationData": {
    "foodItems": [
      {
        "foodType": "chicken",
        "quantity": 2
      },
      {
        "foodType": "rice",
        "quantity": 5
      },
      {
        "foodType": "vegetables",
        "quantity": 3
      }
    ]
  },
  "debugMode": true
}
```

#### Shopping Recommendations
```json
{
  "category": "shopping",
  "emissions": 65.8,
  "calculationData": {
    "categories": [
      {
        "name": "clothing",
        "spending": 200
      },
      {
        "name": "electronics",
        "spending": 500
      }
    ],
    "spending": 700
  },
  "debugMode": true
}
```

---

## 2. ⚡ Generate Recommendations (Minimal Data)

### Method: `POST`
### Endpoint: `/recommendations/generate`

#### Minimal Travel
```json
{
  "category": "travel",
  "emissions": 45.2
}
```

#### Minimal Household
```json
{
  "category": "household",
  "emissions": 120.5
}
```

#### Minimal Food
```json
{
  "category": "food",
  "emissions": 85.3
}
```

#### Minimal Shopping
```json
{
  "category": "shopping",
  "emissions": 65.8
}
```

---

## 3. 🔍 Search Recommendations

### Method: `POST`
### Endpoint: `/recommendations/search`

#### Search by Query
```json
{
  "query": "reduce car emissions",
  "category": "travel",
  "limit": 5
}
```

#### Search by Category Only
```json
{
  "query": "energy saving tips",
  "category": "household",
  "limit": 3
}
```

#### Search All Categories
```json
{
  "query": "sustainable living",
  "limit": 10
}
```

#### Search with Specific Terms
```json
{
  "query": "public transport commuting",
  "category": "travel",
  "limit": 5
}
```

#### Search Food Recommendations
```json
{
  "query": "plant based diet",
  "category": "food",
  "limit": 3
}
```

---

## 4. 📂 Get Recommendations by Category

### Method: `GET`
### Endpoint: `/recommendations/category/{category}`

#### URL Examples:
- `/recommendations/category/travel`
- `/recommendations/category/household`
- `/recommendations/category/food`
- `/recommendations/category/shopping`

#### With Query Parameters:
- `/recommendations/category/travel?limit=5`
- `/recommendations/category/household?limit=3`
- `/recommendations/category/food?limit=10`

---

## 5. 🎲 Get Random Recommendations

### Method: `GET`
### Endpoint: `/recommendations/random/{category}`

#### URL Examples:
- `/recommendations/random/travel`
- `/recommendations/random/household`
- `/recommendations/random/food`
- `/recommendations/random/shopping`

#### With Query Parameters:
- `/recommendations/random/travel?limit=5`
- `/recommendations/random/household?limit=3`
- `/recommendations/random/food?limit=10`

---

## 6. 🏥 Health Check

### Method: `GET`
### Endpoint: `/recommendations/health`

No body required - just a simple GET request.

---

## 7. ❌ Error Testing Cases

### Method: `POST`
### Endpoint: `/recommendations/generate`

#### Missing Required Fields
```json
{
  "category": "travel"
  // Missing emissions
}
```

#### Invalid Category
```json
{
  "category": "invalid_category",
  "emissions": 45.2
}
```

#### Invalid Emissions (String)
```json
{
  "category": "travel",
  "emissions": "not_a_number"
}
```

#### Negative Emissions
```json
{
  "category": "travel",
  "emissions": -10.5
}
```

#### Empty Request Body
```json
{}
```

#### Missing Category
```json
{
  "emissions": 45.2
}
```

#### Invalid Calculation Data Format
```json
{
  "category": "travel",
  "emissions": 45.2,
  "calculationData": {
    "invalidField": "invalid_value"
  }
}
```

---

## 8. 🧪 Advanced Test Cases

### High Emissions (Stress Test)
```json
{
  "category": "travel",
  "emissions": 500.0,
  "calculationData": {
    "privateTransport": [
      {
        "vehicleType": "car",
        "distance": 1000,
        "fuelType": "diesel",
        "vehicleSize": "large"
      }
    ]
  }
}
```

### Low Emissions
```json
{
  "category": "food",
  "emissions": 5.2,
  "calculationData": {
    "foodItems": [
      {
        "foodType": "vegetables",
        "quantity": 1
      }
    ]
  }
}
```

### Mixed Transport Types
```json
{
  "category": "travel",
  "emissions": 75.8,
  "calculationData": {
    "privateTransport": [
      {
        "vehicleType": "car",
        "distance": 30,
        "fuelType": "hybrid",
        "vehicleSize": "small"
      },
      {
        "vehicleType": "motorbike",
        "distance": 15,
        "fuelType": "petrol",
        "vehicleSize": "small"
      }
    ],
    "publicTransport": [
      {
        "transportType": "mrt",
        "distance": 25
      },
      {
        "transportType": "bus",
        "distance": 10
      }
    ]
  }
}
```

### Complex Household Data
```json
{
  "category": "household",
  "emissions": 200.5,
  "calculationData": {
    "numberOfPeople": 6,
    "electricityUsage": 500,
    "waterUsage": 1200,
    "wasteDisposal": 25
  }
}
```

### Multiple Food Items
```json
{
  "category": "food",
  "emissions": 150.3,
  "calculationData": {
    "foodItems": [
      {
        "foodType": "beef",
        "quantity": 3
      },
      {
        "foodType": "chicken",
        "quantity": 5
      },
      {
        "foodType": "fish",
        "quantity": 2
      },
      {
        "foodType": "vegetables",
        "quantity": 8
      },
      {
        "foodType": "rice",
        "quantity": 10
      }
    ]
  }
}
```

### Large Shopping Data
```json
{
  "category": "shopping",
  "emissions": 120.8,
  "calculationData": {
    "categories": [
      {
        "name": "clothing",
        "spending": 500
      },
      {
        "name": "electronics",
        "spending": 1000
      },
      {
        "name": "furniture",
        "spending": 800
      },
      {
        "name": "books",
        "spending": 200
      }
    ],
    "spending": 2500
  }
}
```

---

## 9. 📊 Expected Response Formats

### Successful Response
```json
{
  "success": true,
  "data": {
    "summary": "Based on your travel emissions of 45.2 kg CO₂, here are personalized recommendations to reduce your carbon footprint...",
    "recommendations": "1. **Use Public Transport**\n   - Switch to buses, trains, or MRT for daily commuting\n   - Can reduce emissions by 60-80%\n\n2. **Carpool**\n   - Share rides with colleagues or neighbors\n   - Reduces individual emissions significantly\n\n3. **Walk or Cycle**\n   - For short distances under 2km\n   - Zero emissions and improves health",
    "sessionId": "session_123456789",
    "category": "travel",
    "totalEmissions": 45.2
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to generate recommendations",
  "message": "Missing required field: emissions"
}
```

### Search Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Use Public Transport",
      "content": "Switch to buses, trains, or MRT for daily commuting...",
      "context": "Daily commuting and transportation",
      "impact_level": "high",
      "difficulty": "easy",
      "cost_impact": "low",
      "tags": ["public_transport", "commuting", "KL"],
      "similarity": 0.95
    }
  ]
}
```

### Health Check Response
```json
{
  "success": true,
  "status": "healthy",
  "testResults": "150 recommendations found"
}
```

---

## 10. 🚀 Postman Collection Setup

### Collection Structure
1. **Health Check** - `GET /recommendations/health`
2. **Generate - Minimal Travel** - `POST /recommendations/generate`
3. **Generate - Full Travel** - `POST /recommendations/generate`
4. **Generate - Minimal Household** - `POST /recommendations/generate`
5. **Generate - Full Household** - `POST /recommendations/generate`
6. **Generate - Minimal Food** - `POST /recommendations/generate`
7. **Generate - Full Food** - `POST /recommendations/generate`
8. **Generate - Minimal Shopping** - `POST /recommendations/generate`
9. **Generate - Full Shopping** - `POST /recommendations/generate`
10. **Search - Travel Query** - `POST /recommendations/search`
11. **Search - Household Query** - `POST /recommendations/search`
12. **Search - All Categories** - `POST /recommendations/search`
13. **Get Category - Travel** - `GET /recommendations/category/travel`
14. **Get Category - Household** - `GET /recommendations/category/household`
15. **Get Random - Travel** - `GET /recommendations/random/travel`
16. **Get Random - Household** - `GET /recommendations/random/household`
17. **Error - Missing Emissions** - `POST /recommendations/generate`
18. **Error - Invalid Category** - `POST /recommendations/generate`
19. **Error - Empty Body** - `POST /recommendations/generate`
20. **Advanced - High Emissions** - `POST /recommendations/generate`
21. **Advanced - Mixed Transport** - `POST /recommendations/generate`

### Environment Variables
Create a Postman environment with:
- `base_url`: `https://gp-backend-iter2.vercel.app/api`
- `timeout`: `30000`

### Pre-request Scripts
```javascript
// Set timeout for all requests
pm.request.timeout = 30000;
```

### Tests Scripts
```javascript
// Basic response validation
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

pm.test("Response time is less than 30 seconds", function () {
    pm.expect(pm.response.responseTime).to.be.below(30000);
});
```

---

## 11. 🔧 Testing Tips

### 1. Start with Health Check
Always test the health endpoint first to ensure the service is running.

### 2. Test Minimal Cases First
Start with minimal data (just category and emissions) before testing with full calculation data.

### 3. Use Debug Mode
Enable `debugMode: true` to get detailed information about the recommendation generation process.

### 4. Test Error Cases
Always test error scenarios to ensure proper error handling.

### 5. Monitor Response Times
The AI processing can take up to 30 seconds, so set appropriate timeouts.

### 6. Validate Response Structure
Check that responses contain the expected fields and data types.

### 7. Test All Categories
Ensure all four categories (travel, household, food, shopping) work correctly.

### 8. Test Edge Cases
Test with very high and very low emission values.

---

## 12. 📝 Notes

- **API Base URL**: `https://gp-backend-iter2.vercel.app/api`
- **Timeout**: 30 seconds for recommendation generation
- **Required Fields**: `category` and `emissions`
- **Optional Fields**: `calculationData`, `debugMode`, `sessionId`
- **Supported Categories**: `travel`, `household`, `food`, `shopping`
- **Response Format**: JSON with `success`, `data`, and optional `error` fields

---

## 13. 🎯 Quick Test Checklist

- [ ] Health check returns 200
- [ ] Minimal travel request works
- [ ] Full travel request works
- [ ] All categories (travel, household, food, shopping) work
- [ ] Search functionality works
- [ ] Random recommendations work
- [ ] Error handling works for missing fields
- [ ] Error handling works for invalid data
- [ ] Response times are acceptable (< 30 seconds)
- [ ] Response format is correct
- [ ] Debug mode provides additional information

---

*This file contains all the test cases needed to thoroughly test the GreenPulse Recommendations API in Postman. Copy the JSON examples into your Postman requests and adjust the base URL as needed.*
