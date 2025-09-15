# 🧪 GreenPulse Testing Guide

This guide explains how to test all the GreenPulse calculator APIs and ensure they're working correctly.

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Server running on `http://localhost:3001`
- Database connected and populated

### Run All Tests
```bash
# Test all four calculators at once
node test-all-calculators.js
```

## 📋 Available Test Scripts

### 1. **test-all-calculators.js**
Tests all four calculators with basic scenarios.

**Usage:**
```bash
node test-all-calculators.js
```

**What it tests:**
- ✅ Food Calculator (Apples + Chicken breast)
- ✅ Shopping Calculator (Supermarkets + Clothing)
- ✅ Travel Calculator (Car + Bus)
- ✅ Household Calculator (2 people household)

### 2. **test-food-calculator.js**
Comprehensive food calculator testing.

**Usage:**
```bash
node test-food-calculator.js
```

**What it tests:**
- Single food items
- Multiple items from different groups
- Average subcategory calculations
- Case insensitive matching
- Error handling
- All dropdown endpoints

### 3. **test-shopping-calculator.js**
Comprehensive shopping calculator testing.

**Usage:**
```bash
node test-shopping-calculator.js
```

**What it tests:**
- Single shopping items
- Multiple items from different groups
- Average subcategory calculations
- Case insensitive matching
- Error handling
- All dropdown endpoints

### 4. **test-travel-calculator.js**
Comprehensive travel calculator testing.

**Usage:**
```bash
node test-travel-calculator.js
```

**What it tests:**
- Private transport (cars, motorbikes)
- Public transport (bus, MRT, LRT, etc.)
- Mixed transport scenarios
- Electric vehicles
- Error handling
- Emission factor endpoints

### 5. **test-household-calculator.js**
Comprehensive household calculator testing.

**Usage:**
```bash
node test-household-calculator.js
```

**What it tests:**
- Different household sizes
- Various consumption levels
- Electricity, water, and waste calculations
- Per-person emission analysis
- Error handling

### 6. **test-dropdowns.js**
Tests all dropdown endpoints.

**Usage:**
```bash
node test-dropdowns.js
```

**What it tests:**
- Food dropdown endpoints (4 endpoints)
- Shopping dropdown endpoints (3 endpoints)
- Response validation

## 🎯 Test Scenarios

### Food Calculator Tests

#### Basic Functionality
```javascript
// Single item
{ foodItems: [{ foodType: "Apples", quantity: 2 }] }

// Multiple items
{ foodItems: [
  { foodType: "Apples", quantity: 2 },
  { foodType: "Chicken breast", quantity: 1.5 }
] }
```

#### Average Calculations
```javascript
// Subcategory average
{ foodItems: [{ 
  foodType: "average", 
  subcategoryGroup: "Fruits", 
  quantity: 1 
}] }
```

#### Case Insensitive
```javascript
// All of these work
{ foodType: "apples" }
{ foodType: "APPLES" }
{ foodType: "Apples" }
```

### Shopping Calculator Tests

#### Basic Functionality
```javascript
// Single item
{ shoppingItems: [{ 
  type: "Supermarkets and Other Grocery (except Convenience) Stores", 
  quantity: 100 
}] }

// Multiple items
{ shoppingItems: [
  { type: "Supermarkets and Other Grocery (except Convenience) Stores", quantity: 100 },
  { type: "Clothing Stores", quantity: 200 }
] }
```

#### Average Calculations
```javascript
// Subcategory average
{ shoppingItems: [{ 
  type: "average", 
  subcategoryGroup: "Groceries & Beverages", 
  quantity: 100 
}] }
```

### Travel Calculator Tests

#### Private Transport
```javascript
{ privateTransport: [
  { vehicleType: "car", vehicleSize: "small", fuelType: "petrol", distance: 50 }
] }
```

#### Public Transport
```javascript
{ publicTransport: [
  { transportType: "bus", distance: 20 },
  { transportType: "mrt", distance: 15 }
] }
```

#### Mixed Transport
```javascript
{
  privateTransport: [
    { vehicleType: "car", vehicleSize: "medium", fuelType: "diesel", distance: 30 }
  ],
  publicTransport: [
    { transportType: "lrt", distance: 10 }
  ]
}
```

### Household Calculator Tests

#### Basic Household
```javascript
{
  numberOfPeople: 2,
  electricityUsage: 200,
  waterUsage: 10,
  wasteDisposal: 5
}
```

#### Large Household
```javascript
{
  numberOfPeople: 5,
  electricityUsage: 500,
  waterUsage: 25,
  wasteDisposal: 12
}
```

## 🔍 Expected Results

### Successful Response Format
```json
{
  "success": true,
  "totalEmissions": 15.8,
  "treeSaplingsNeeded": "0.26",
  "results": {
    "total": 15.8,
    "breakdown": [...],
    "groups": {...}
  }
}
```

### Error Response Format
```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": [
    "Food item 1: quantity must be a positive number"
  ]
}
```

## 🚨 Error Testing

All test scripts include error scenarios:

### Validation Errors
- Missing required fields
- Invalid data types
- Negative quantities
- Invalid enum values

### Edge Cases
- Empty arrays
- Zero values
- Very large numbers
- Special characters

## 📊 Performance Testing

### Response Times
- **Food Calculator**: < 500ms
- **Shopping Calculator**: < 500ms
- **Travel Calculator**: < 500ms
- **Household Calculator**: < 300ms
- **Dropdown Endpoints**: < 200ms

### Load Testing
```bash
# Test multiple concurrent requests
for i in {1..10}; do
  node test-all-calculators.js &
done
wait
```

## 🛠️ Manual Testing

### Using curl

```bash
# Test food calculator
curl -X POST http://localhost:3001/api/calculate/food \
  -H "Content-Type: application/json" \
  -d '{"foodItems": [{"foodType": "Apples", "quantity": 2}]}'

# Test shopping calculator
curl -X POST http://localhost:3001/api/calculate/shopping \
  -H "Content-Type: application/json" \
  -d '{"shoppingItems": [{"type": "Supermarkets and Other Grocery (except Convenience) Stores", "quantity": 100}]}'

# Test travel calculator
curl -X POST http://localhost:3001/api/calculate/travel \
  -H "Content-Type: application/json" \
  -d '{"privateTransport": [{"vehicleType": "car", "vehicleSize": "small", "fuelType": "petrol", "distance": 50}]}'

# Test household calculator
curl -X POST http://localhost:3001/api/calculate/household \
  -H "Content-Type: application/json" \
  -d '{"numberOfPeople": 2, "electricityUsage": 200, "waterUsage": 10, "wasteDisposal": 5}'
```

### Health Checks

```bash
# Server health
curl http://localhost:3001/health

# Database health
curl http://localhost:3001/api/test-db

# All systems health
curl http://localhost:3001/api/test-all-systems
```

## 🔧 Troubleshooting

### Common Issues

#### "Server not running"
```bash
# Start the server
npm start
# or
npm run dev
```

#### "Database connection failed"
```bash
# Check database connection
curl http://localhost:3001/api/test-db

# Check all systems
curl http://localhost:3001/api/test-all-systems
```

#### "Test script not found"
```bash
# Make sure you're in the project root
ls test-*.js

# Run from project root
node test-all-calculators.js
```

#### "Network Error"
- Check if server is running on port 3001
- Verify no firewall blocking
- Check server logs for errors

### Debug Mode

Add debug logging to test scripts:

```javascript
// Add to any test script
console.log('Debug: Request data:', JSON.stringify(testData, null, 2));
console.log('Debug: Response:', JSON.stringify(data, null, 2));
```

## 📈 Test Coverage

### API Endpoints Covered
- ✅ `/api/calculate/food`
- ✅ `/api/calculate/shopping`
- ✅ `/api/calculate/travel`
- ✅ `/api/calculate/household`
- ✅ `/api/food-dropdown/*` (4 endpoints)
- ✅ `/api/shopping-dropdown/*` (3 endpoints)
- ✅ `/api/emission-factors/*` (5 endpoints)

### Test Types
- ✅ Happy path testing
- ✅ Error handling
- ✅ Edge cases
- ✅ Validation testing
- ✅ Performance testing
- ✅ Integration testing

## 🎯 Best Practices

### 1. Run Tests Regularly
```bash
# Before deployment
node test-all-calculators.js

# After code changes
node test-food-calculator.js
node test-shopping-calculator.js
node test-travel-calculator.js
node test-household-calculator.js
```

### 2. Test Error Scenarios
Always test both success and failure cases to ensure robust error handling.

### 3. Monitor Performance
Keep an eye on response times and optimize if they exceed expected thresholds.

### 4. Validate Data
Ensure all test data matches the expected API contract and database schema.

## 🚀 Continuous Integration

### GitHub Actions Example
```yaml
name: Test Calculators
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm start &
      - run: sleep 10
      - run: node test-all-calculators.js
```

---

## 🎉 Ready to Test?

Start with the quick test:
```bash
node test-all-calculators.js
```

Then dive into specific calculator tests for more comprehensive validation!

**Happy testing! 🧪✨**
