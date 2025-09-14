# Carbon Footprint Calculator API Guide

This guide explains how to call the carbon footprint calculation APIs and what values need to be passed in.

## Frontend URL
```
https://greenpulse-frontend-v.vercel.app
```

## Base URL (Development)
```
http://localhost:3001/api
```

## Production API URL
```
https://gp-backend-iter2.vercel.app/api
```

## 1. Travel Calculator API

> **Note**: All text inputs are case-insensitive. You can use any combination of uppercase and lowercase letters.

### Endpoint
```
POST /calculate/travel
```

### Request Body
```json
{
  "privateTransport": [
    {
      "vehicleType": "car",
      "vehicleSize": "small",
      "fuelType": "petrol",
      "distance": 100
    },
    {
      "vehicleType": "motorbike",
      "vehicleSize": "medium",
      "fuelType": "petrol",
      "distance": 50
    }
  ],
  "publicTransport": [
    {
      "transportType": "bus",
      "distance": 30
    },
    {
      "transportType": "lrt",
      "distance": 25
    }
  ]
}
```

### Parameters

#### Private Transport (Optional Array)
- **vehicleType** (string): Vehicle category (case-insensitive)
  - Valid values: `"car"`, `"motorbike"` (or any case variation like `"Car"`, `"CAR"`, `"Motorbike"`, etc.)
- **vehicleSize** (string): Vehicle size (case-insensitive)
  - Valid values: `"small"`, `"medium"`, `"large"`, `"average"` (or any case variation)
- **fuelType** (string): Fuel type (case-insensitive)
  - Valid values: `"diesel"`, `"petrol"`, `"hybrid"`, `"phev"`, `"bev"`, `"electric"` (or any case variation)
- **distance** (number): Distance traveled in kilometers

#### Public Transport (Optional Array)
- **transportType** (string): Type of public transport (case-insensitive)
  - Valid values: `"bus"`, `"mrt"`, `"lrt"`, `"monorail"`, `"ktm"`, `"average train"` (or any case variation)
- **distance** (number): Distance traveled in kilometers

### Case-Insensitive Examples
All of these inputs are valid and will work the same way:
```json
// All of these are equivalent:
{ "vehicleType": "car" }     // Works
{ "vehicleType": "Car" }     // Works  
{ "vehicleType": "CAR" }     // Works
{ "vehicleType": "CaR" }     // Works

{ "fuelType": "petrol" }     // Works
{ "fuelType": "Petrol" }     // Works
{ "fuelType": "PETROL" }     // Works

{ "transportType": "bus" }   // Works
{ "transportType": "Bus" }   // Works
{ "transportType": "BUS" }   // Works
```

### Response
```json
{
  "success": true,
  "totalEmissions": 17.43,
  "treeSaplingsNeeded": "0.29",
  "results": {
    "privateTransport": {
      "total": 14.31,
      "breakdown": [
        {
          "vehicleType": "car",
          "vehicleSize": "small",
          "fuelType": "petrol",
          "distance": 100,
          "emissionFactor": "0.143080",
          "emissions": 14.31
        }
      ]
    },
    "publicTransport": {
      "total": 3.12,
      "breakdown": [
        {
          "transportType": "bus",
          "distance": 30,
          "emissionFactor": "0.103850",
          "emissions": 3.12
        }
      ]
    }
  }
}
```

---

## 2. Household Calculator API

> **Note**: All text inputs are case-insensitive. You can use any combination of uppercase and lowercase letters.

### Endpoint
```
POST /calculate/household
```

### Request Body
```json
{
  "numberOfPeople": 4,
  "electricityUsage": 300,
  "waterUsage": 15,
  "wasteDisposal": 10
}
```

### Parameters
- **numberOfPeople** (number): Number of people in the household (required, must be positive)
- **electricityUsage** (number): Monthly electricity consumption in kWh (optional, default: 0)
- **waterUsage** (number): Monthly water consumption in m³ (optional, default: 0)
- **wasteDisposal** (number): Weekly waste disposal in kg (optional, default: 0)

### Response
```json
{
  "success": true,
  "totalMonthlyEmissions": 1227.65,
  "treeSaplingsNeeded": "20.29",
  "results": {
    "total": 1227.65,
    "breakdown": [
      {
        "category": "Average Household",
        "factor": "Per Person",
        "numberOfPeople": 4,
        "dailyEmissionFactor": "32.2466",
        "monthlyEmissions": 967.4
      },
      {
        "category": "Electricity",
        "factor": "kWh",
        "monthlyUsage": 300,
        "emissionFactor": "0.774",
        "monthlyEmissions": 232.2
      },
      {
        "category": "Water",
        "factor": "m³",
        "monthlyUsage": 15,
        "emissionFactor": "0.544",
        "monthlyEmissions": 8.16
      },
      {
        "category": "Waste Disposal",
        "factor": "kg",
        "weeklyUsage": 10,
        "monthlyUsage": 40,
        "emissionFactor": "0.497242",
        "monthlyEmissions": 19.89
      }
    ]
  }
}
```

---

## 3. Food Calculator API

> **Note**: All text inputs are case-insensitive. You can use any combination of uppercase and lowercase letters.

### Endpoint
```
POST /calculate/food
```

### Request Body
```json
{
  "foodItems": [
    {
      "foodType": "Beef steak",
      "quantity": 1,
      "unit": "kg"
    },
    {
      "foodType": "Chicken breast",
      "quantity": 2,
      "unit": "kg"
    }
  ]
}
```

### Parameters
- **foodItems** (array): Array of food items
  - **foodType** (string): Type of food (must match exact names from database)
    - Valid examples: `"Beef steak"`, `"Chicken breast"`, `"Apples"`, `"Rice"`, `"Milk"`, etc.
    - See `/api/emission-factors/food` endpoint for complete list
  - **quantity** (number): Amount of food (required, must be positive)
  - **unit** (string): Unit of measurement (required)
    - Valid values: `"kg"`, `"g"`, `"lbs"`, `"oz"`

### Response
```json
{
  "success": true,
  "totalEmissions": 30.5,
  "treeSaplingsNeeded": "0.50",
  "results": {
    "total": 30.5,
    "breakdown": [
      {
        "foodType": "beef",
        "quantity": 1,
        "unit": "kg",
        "emissionFactor": "27.0",
        "emissions": 27.0
      },
      {
        "foodType": "chicken",
        "quantity": 2,
        "unit": "kg",
        "emissionFactor": "1.75",
        "emissions": 3.5
      }
    ]
  }
}
```

---

## 4. Shopping Calculator API

> **Note**: All text inputs are case-insensitive. You can use any combination of uppercase and lowercase letters.

### Endpoint
```
POST /calculate/shopping
```

### Request Body
```json
{
  "shoppingItems": [
    {
      "category": "Apparel & Personal Care",
      "subcategory": "Clothing",
      "quantity": 3,
      "unit": "RM"
    },
    {
      "category": "Home & Living",
      "subcategory": "Home, Appliances & Electronics",
      "quantity": 1,
      "unit": "RM"
    }
  ]
}
```

### Parameters
- **shoppingItems** (array): Array of shopping items
  - **category** (string): Shopping category (required)
    - Valid values: `"Food & Beverages"`, `"Home & Living"`, `"Apparel & Personal Care"`
  - **subcategory** (string): Shopping subcategory (required)
    - Valid values: `"General Merchandise"`, `"Groceries & Beverages"`, `"Clothing"`, `"Accessories"`, `"Health & Pharmacy"`, `"Home & Garden"`, `"Home, Appliances & Electronics"`, `"Entertainment"`
  - **quantity** (number): Spending amount (required, must be positive)
  - **unit** (string): Currency unit (required)
    - Valid values: `"RM"`, `"USD"`, `"EUR"`, `"GBP"`

### Response
```json
{
  "success": true,
  "totalEmissions": 15.8,
  "treeSaplingsNeeded": "0.26",
  "results": {
    "total": 15.8,
    "breakdown": [
      {
        "category": "clothing",
        "subcategory": "apparel",
        "item": "t-shirt",
        "quantity": 3,
        "unit": "pieces",
        "emissionFactor": "0.5",
        "emissions": 1.5
      },
      {
        "category": "electronics",
        "subcategory": "devices",
        "item": "smartphone",
        "quantity": 1,
        "unit": "unit",
        "emissionFactor": "14.3",
        "emissions": 14.3
      }
    ]
  }
}
```

---

## 5. Emission Factors API

### Endpoints
```
GET /emission-factors/food
GET /emission-factors/shopping
GET /emission-factors/vehicles
GET /emission-factors/public-transport
GET /emission-factors/household
```

### Response Format
```json
{
  "success": true,
  "factors": [
    {
      "id": 1,
      "name": "beef",
      "category": "meat",
      "subcategory": "red_meat",
      "emissionFactor": "27.0",
      "unit": "kg CO2e/kg"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: numberOfPeople, electricityUsage, waterUsage, wasteDisposal"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to calculate travel emissions",
  "message": "Database connection failed"
}
```

---

## Tree Saplings Calculation

All calculators return a `treeSaplingsNeeded` field that shows how many tree saplings need to be planted for 10 years to offset the emissions.

- **Formula**: `totalEmissions / 60.5`
- **Format**: 2 decimal places (e.g., "0.75", "2.99")
- **60.5 kg CO2e** = amount absorbed by one tree sapling over 10 years

---

## Example Usage with JavaScript

```javascript
// Travel Calculator
const travelData = {
  privateTransport: [
    {
      vehicleType: "car",
      vehicleSize: "small",
      fuelType: "petrol",
      distance: 100
    }
  ],
  publicTransport: [
    {
      transportType: "bus",
      distance: 30
    }
  ]
};

// For development
const API_BASE_URL = 'http://localhost:3001/api';

// For production
// const API_BASE_URL = 'https://gp-backend-iter2.vercel.app/api';

const response = await fetch(`${API_BASE_URL}/calculate/travel`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(travelData)
});

const result = await response.json();
console.log(`Total emissions: ${result.totalEmissions} kg CO2e`);
console.log(`Tree saplings needed: ${result.treeSaplingsNeeded}`);
```

---

## Database Requirements

Make sure your database has the following data:

### Vehicle Categories
- car, motorcycle, truck

### Vehicle Sizes
- small, medium, large, standard

### Fuel Types
- petrol, diesel, electric, hybrid

### Public Transport Types
- bus, lrt, mrt, ktm, monorail

### Household Factors
- average_household (daily factor)
- electricity (per kWh)
- water (per m³)
- waste (per kg)

### Food & Shopping Entities
- Must match the names in your database tables
- Use the emission factors API to get valid names

---

## Deployment Notes

### Frontend (Vercel)
- **URL**: https://greenpulse-frontend-v.vercel.app
- **Framework**: Vue.js with Vite
- **Environment**: Production

### Backend (Vercel + Neon + Drizzle)
- **Platform**: Vercel (recommended)
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Environment**: Production

### Environment Variables for Production
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
NODE_ENV=production
```

### CORS Configuration
Make sure your backend allows requests from:
```
https://greenpulse-frontend-v.vercel.app
```

## Complete Deployment Guide

### 1. Frontend Deployment (Vercel)
```bash
# In your frontend root directory
npm run build
# Deploy to Vercel (already done)
```

### 2. Backend Deployment (Vercel + Neon + Drizzle)

#### Step 1: Prepare Backend for Vercel
The `vercel.json` file is already created in your backend folder.

#### Step 2: Deploy to Vercel
1. **Push backend code** to a separate repository or subfolder
2. **Connect to Vercel** and import the backend project
3. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL` = your Neon connection string
   - `NODE_ENV` = production

#### Step 3: Database Setup
```bash
# Run migrations on Neon database
cd backend
npm run db:migrate

# Import your CSV data
npm run import-csv-quoted
```

#### Step 4: Update Frontend API Configuration
```javascript
// In src/services/api.js
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://gp-backend-iter2.vercel.app/api'
  : 'http://localhost:3001/api';
```

### 3. Vercel Configuration Files

#### Backend `vercel.json` (already created)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Frontend `vercel.json` (create if needed)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 4. Environment Variables

#### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://gp-backend-iter2.vercel.app/api
```

#### Backend (Vercel Dashboard)
```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
NODE_ENV=production
```

### 5. CORS Configuration
Your backend already includes CORS configuration for:
- `http://localhost:5173` (Vite dev server)
- `https://greenpulse-frontend-v.vercel.app` (Vercel production)

---

## 6. Valid Types Reference

### Travel Calculator Valid Types

#### Private Transport
- **vehicleType**: `"Car"`, `"Motorbike"` (case-insensitive)
- **vehicleSize**: `"small"`, `"medium"`, `"large"`, `"average"` (case-insensitive)
- **fuelType**: `"diesel"`, `"petrol"`, `"hybrid"`, `"PHEV"`, `"BEV"`, `"electric"` (case-insensitive)

#### Public Transport
- **transportType**: `"Bus"`, `"MRT"`, `"LRT"`, `"Monorail"`, `"KTM"`, `"Average train"` (case-insensitive)

### Household Calculator Valid Types

#### Parameters
- **numberOfPeople**: Positive number (required)
- **electricityUsage**: Non-negative number (optional, default: 0)
- **waterUsage**: Non-negative number (optional, default: 0)
- **wasteDisposal**: Non-negative number (optional, default: 0)

### Food Calculator Valid Types

#### Food Types (Sample - see `/api/emission-factors/food` for complete list)
- **foodType**: `"Beef steak"`, `"Chicken breast"`, `"Apples"`, `"Rice"`, `"Milk"`, `"Bread"`, `"Eggs"`, `"Potatoes"`, `"Tomatoes"`, `"Salmon"`, etc. (case-insensitive)
- **unit**: `"kg"`, `"g"`, `"lbs"`, `"oz"` (case-insensitive)

### Shopping Calculator Valid Types

#### Categories
- **category**: `"Food & Beverages"`, `"Home & Living"`, `"Apparel & Personal Care"` (case-insensitive)

#### Subcategories
- **subcategory**: `"General Merchandise"`, `"Groceries & Beverages"`, `"Clothing"`, `"Accessories"`, `"Health & Pharmacy"`, `"Home & Garden"`, `"Home, Appliances & Electronics"`, `"Entertainment"` (case-insensitive)

#### Currency Units
- **unit**: `"RM"`, `"USD"`, `"EUR"`, `"GBP"` (case-insensitive)

---

## 7. Error Handling

### Validation Errors
The API now includes comprehensive validation for all input parameters. Invalid values will return a 400 status with detailed error messages:

```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": [
    "Private transport item 1: Invalid vehicleType. Must be one of: Car, Motorbike",
    "Food item 2: quantity must be a positive number"
  ]
}
```

### Common Error Responses
- **400 Bad Request**: Invalid input data or validation errors
- **500 Internal Server Error**: Database connection issues or calculation errors
