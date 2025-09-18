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
- **vehicleType** (string): Vehicle category (case-insensitive, required)
  - Valid values: `"car"`, `"motorbike"` (or any case variation like `"Car"`, `"CAR"`, `"Motorbike"`, etc.)
  - **Validation**: Must be one of the valid vehicle types
  - **Examples**: `"car"`, `"Car"`, `"CAR"`, `"motorbike"`, `"Motorbike"`, `"MOTORBIKE"`
- **vehicleSize** (string): Vehicle size (case-insensitive, required)
  - Valid values: `"small"`, `"medium"`, `"large"`, `"average"` (or any case variation)
  - **Validation**: Must be one of the valid vehicle sizes
  - **Examples**: `"small"`, `"Small"`, `"SMALL"`, `"medium"`, `"Medium"`, `"MEDIUM"`
- **fuelType** (string): Fuel type (case-insensitive, required)
  - Valid values: `"diesel"`, `"petrol"`, `"hybrid"`, `"phev"`, `"bev"`, `"electric"` (or any case variation)
  - **Validation**: Must be one of the valid fuel types
  - **Examples**: `"petrol"`, `"Petrol"`, `"PETROL"`, `"diesel"`, `"Diesel"`, `"DIESEL"`
- **distance** (number): Distance traveled in kilometers (required, must be positive)
  - **Validation**: Must be a positive number
  - **Examples**: `100`, `50.5`, `0.1`

#### Public Transport (Optional Array)
- **transportType** (string): Type of public transport (case-insensitive, required)
  - Valid values: `"bus"`, `"mrt"`, `"lrt"`, `"monorail"`, `"ktm"`, `"average train"` (or any case variation)
  - **Validation**: Must be one of the valid transport types
  - **Examples**: `"bus"`, `"Bus"`, `"BUS"`, `"mrt"`, `"MRT"`, `"lrt"`, `"LRT"`
- **distance** (number): Distance traveled in kilometers (required, must be positive)
  - **Validation**: Must be a positive number
  - **Examples**: `30`, `25.5`, `0.1`

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
  - **Validation**: Must be a positive integer
  - **Examples**: `1`, `2`, `4`, `6`
- **electricityUsage** (number): Monthly electricity consumption in kWh (optional, default: 0)
  - **Validation**: Must be a non-negative number
  - **Examples**: `300`, `150.5`, `0`
- **waterUsage** (number): Monthly water consumption in m³ (optional, default: 0)
  - **Validation**: Must be a non-negative number
  - **Examples**: `15`, `8.5`, `0`
- **wasteDisposal** (number): Weekly waste disposal in kg (optional, default: 0)
  - **Validation**: Must be a non-negative number
  - **Examples**: `10`, `5.5`, `0`

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

> **Note**: The food calculator now uses a simplified 3-question structure with frequency-based calculations instead of specific quantities. All text inputs are case-insensitive.

### Endpoint
```
POST /calculate/food
```

### Request Body
```json
{
  "foodItems": [
    {
      "category": "string",           // Required: "animal", "plant", or "grain"
      "frequency": "string",          // Required: "Never", "Infrequently", "Occasionally", "Often", "Very Often"
      "detailed": [                   // Optional: Array of detailed food types
        {
          "type": "string",           // Required: Specific food type
          "frequency": "string"       // Required: Frequency for this specific type
        }
      ]
    }
  ]
}
```

### Parameters

#### Category Types
- **animal**: Animal products (meat, dairy, eggs, seafood)
- **plant**: Fruits and vegetables
- **grain**: Grains and staples (rice, bread, noodles)

#### Frequency Levels
- **Never**: Skip this category (no emissions calculated)
- **Infrequently**: Low consumption frequency
- **Occasionally**: Moderate consumption frequency  
- **Often**: High consumption frequency
- **Very Often**: Very high consumption frequency

#### Detailed Input Types

**Animal Products:**
- `"Beef"` - Beef products
- `"Lamb"` - Lamb products
- `"Pork"` - Pork products
- `"Poultry"` - Chicken, turkey, etc.
- `"Fish or shellfish"` - Fish and seafood
- `"Eggs, cheese or dairy"` - Eggs, cheese, and dairy products

**Plant Products:**
- `"Fruits"` - All fruits
- `"Vegetables"` - All vegetables

**Grains:**
- `"Rice"` - Rice products
- `"Noodles"` - Noodle products
- `"Bread"` - Bread products

### Frequency Multipliers

The system uses frequency multipliers to calculate weekly consumption based on average daily consumption data:

#### Animal Products
**Simple Frequency:**
- Never: Skip
- Infrequently: Dairy×4, Eggs×4
- Occasionally: Dairy×5, Eggs×5, Red meat×3, Poultry×3, Seafood×3
- Often: Dairy×6, Eggs×6, Red meat×5, Poultry×5, Seafood×5
- Very Often: Dairy×7, Eggs×7, Red meat×7, Poultry×7, Seafood×7

**Detailed Frequency:**
- Beef/Lamb/Pork/Poultry/Fish: [0, 0, 3, 5, 7] (Never, Infrequently, Occasionally, Often, Very Often)
- Eggs/cheese/dairy: [0, 4, 5, 6, 7]

#### Plant Products
**Simple Frequency:**
- Never: Skip
- Infrequently: Fruits×4, Vegetables×4
- Occasionally: Fruits×5, Vegetables×5
- Often: Fruits×6, Vegetables×6
- Very Often: Fruits×7, Vegetables×7

**Detailed Frequency:**
- Fruits/Vegetables: [0, 4, 5, 6, 7]

#### Grains
**Simple Frequency:**
- Never: Skip
- Infrequently: Cereals×4
- Occasionally: Cereals×5
- Often: Cereals×6
- Very Often: Cereals×7

**Detailed Frequency:**
- Rice/Noodles/Bread: [0, 4, 5, 6, 7]

### Response
```json
{
  "success": true,
  "totalEmissions": 26.84,
  "treeSaplingsNeeded": "0.44",
  "results": {
    "total": 26.84,
    "breakdown": [
      {
        "category": "animal",
        "type": "Beef",
        "frequency": "Occasionally",
        "multiplier": 3,
        "emissions": 6.06
      }
    ],
    "categories": {
      "animal": {
        "name": "Animal Products",
        "total": 9.38,
        "breakdown": [
          {
            "type": "Beef",
            "frequency": "Occasionally",
            "multiplier": 3,
            "emissions": 6.06
          }
        ]
      },
      "plant": {
        "name": "Fruits and Vegetables",
        "total": 3.18,
        "breakdown": [...]
      },
      "grain": {
        "name": "Grains and Staples",
        "total": 14.28,
        "breakdown": [...]
      }
    }
  }
}
```

### Sample Requests

#### Simple Frequency Input
```json
{
  "foodItems": [
    {
      "category": "animal",
      "frequency": "Often"
    },
    {
      "category": "plant",
      "frequency": "Very Often"
    },
    {
      "category": "grain",
      "frequency": "Occasionally"
    }
  ]
}
```

#### Detailed Input
```json
{
  "foodItems": [
    {
      "category": "animal",
      "frequency": "Often",
      "detailed": [
        {
          "type": "Beef",
          "frequency": "Occasionally"
        },
        {
          "type": "Poultry",
          "frequency": "Often"
        },
        {
          "type": "Eggs, cheese or dairy",
          "frequency": "Very Often"
        }
      ]
    },
    {
      "category": "plant",
      "frequency": "Often",
      "detailed": [
        {
          "type": "Fruits",
          "frequency": "Often"
        },
        {
          "type": "Vegetables",
          "frequency": "Very Often"
        }
      ]
    },
    {
      "category": "grain",
      "frequency": "Often",
      "detailed": [
        {
          "type": "Rice",
          "frequency": "Often"
        },
        {
          "type": "Bread",
          "frequency": "Occasionally"
        }
      ]
    }
  ]
}
```

#### Mixed Input (Some Simple, Some Detailed)
```json
{
  "foodItems": [
    {
      "category": "animal",
      "frequency": "Never"
    },
    {
      "category": "plant",
      "frequency": "Infrequently"
    },
    {
      "category": "grain",
      "frequency": "Often",
      "detailed": [
        {
          "type": "Noodles",
          "frequency": "Often"
        }
      ]
    }
  ]
}
```

### Calculation Logic

1. **Weekly Consumption**: Daily average consumption (grams) × frequency multiplier = weekly consumption (grams)
2. **Emissions**: Weekly consumption (kg) × emission factor = CO2e emissions
3. **Simple Input**: Uses subcategory average emission factors
4. **Detailed Input**: Uses specific entity emission factors when available, falls back to subcategory averages
5. **Never Frequency**: Skips calculation for that category/type

### Validation

- **category**: Must be one of `"animal"`, `"plant"`, `"grain"`
- **frequency**: Must be one of `"Never"`, `"Infrequently"`, `"Occasionally"`, `"Often"`, `"Very Often"`
- **detailed.type**: Must be a valid type for the category
- **detailed.frequency**: Must be one of the valid frequency values

### Case-Insensitive Examples
All of these inputs are valid and will work the same way:
```json
// All of these are equivalent:
{ "category": "animal" }     // Works
{ "category": "Animal" }     // Works  
{ "category": "ANIMAL" }     // Works
{ "category": "AnImAl" }     // Works

{ "frequency": "often" }     // Works
{ "frequency": "Often" }     // Works
{ "frequency": "OFTEN" }     // Works

{ "type": "beef" }           // Works
{ "type": "Beef" }           // Works
{ "type": "BEEF" }           // Works
```

### Error Response
```json
{
  "error": "Validation failed",
  "message": "Invalid food item data",
  "details": [
    "Food item 1: category is required and must be one of: animal, plant, grain",
    "Food item 2: frequency is required and must be one of: Never, Infrequently, Occasionally, Often, Very Often"
  ]
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
      "type": "string",               // Required: Shopping entity name or "average"
      "quantity": number,             // Required: Amount in RM
      "subcategoryGroup": "string"    // Optional: Required only when type is "average"
    }
  ]
}
```

### Parameters
- **shoppingItems** (array): Array of shopping items
  - **type** (string): Either a specific entity name from `shopping_entities.csv` or "average"
    - **Case Insensitive**: "clothing stores", "CLOTHING STORES", "Clothing Stores" all work
    - Valid examples: `"Supermarkets and Other Grocery (except Convenience) Stores"`, `"Clothing Stores"`, `"Furniture Stores"`, `"Pharmacies and Drug Stores"`, `"Book Stores"`, etc.
    - Use `"average"` for subcategory average calculations
    - See dropdown endpoints for complete lists
  - **quantity** (number): Amount in RM (Malaysian Ringgit) (positive number, required)
  - **subcategoryGroup** (string): Required when `type` is "average". Valid values (case insensitive):
    - `"General Merchandise"`
    - `"Groceries & Beverages"`
    - `"Clothing"`
    - `"Accessories"`
    - `"Health & Pharmacy"`
    - `"Home & Garden"`
    - `"Home, Appliances & Electronics"`
    - `"Entertainment"`

### Shopping Dropdown Endpoints

#### 1. Groceries & Beverages Dropdown
**Endpoint:** `GET /shopping-dropdown/groceries-beverages`

**Description:** Returns all shopping entities from the Groceries & Beverages subcategory.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 360,
      "name": "Supermarkets and Other Grocery (except Convenience) Stores",
      "subcategory": "Groceries & Beverages"
    },
    {
      "id": 361,
      "name": "Convenience Stores",
      "subcategory": "Groceries & Beverages"
    }
  ],
  "count": 15,
  "subcategories": ["Groceries & Beverages"]
}
```

#### 2. Home & Garden, Appliances & Electronics, Entertainment, General Merchandise Dropdown
**Endpoint:** `GET /shopping-dropdown/home-garden-appliances-entertainment-general`

**Description:** Returns all shopping entities from Home & Garden, Appliances & Electronics, Entertainment, and General Merchandise subcategories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 349,
      "name": "Floor Covering Stores",
      "subcategory": "Home & Garden"
    },
    {
      "id": 352,
      "name": "Household Appliance Stores",
      "subcategory": "Home, Appliances & Electronics"
    }
  ],
  "count": 29,
  "subcategories": ["Home & Garden", "Home, Appliances & Electronics", "Entertainment", "General Merchandise"]
}
```

#### 3. Clothing, Accessories, Health & Pharmacy Dropdown
**Endpoint:** `GET /shopping-dropdown/clothing-accessories-health-pharmacy`

**Description:** Returns all shopping entities from Clothing, Accessories, and Health & Pharmacy subcategories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 375,
      "name": "Clothing Stores",
      "subcategory": "Clothing"
    },
    {
      "id": 376,
      "name": "Shoe Stores",
      "subcategory": "Accessories"
    }
  ],
  "count": 25,
  "subcategories": ["Clothing", "Accessories", "Health & Pharmacy"]
}
```

### Response
```json
{
  "success": true,
  "totalEmissions": 14.58,
  "treeSaplingsNeeded": "0.66",
  "results": {
    "total": 14.58,
    "breakdown": [
      {
        "type": "Supermarkets and Other Grocery (except Convenience) Stores",
        "quantity": 100,
        "subcategory": "Groceries & Beverages",
        "group": "Groceries & Beverages",
        "emissionFactor": "0.044286",
        "emissions": 4.4286
      }
    ],
    "groups": {
      "groceries-beverages": {
        "name": "Groceries & Beverages",
        "subcategoryIds": [2],
        "total": 14.58,
        "breakdown": [...]
      },
      "home-garden-appliances-entertainment-general": {
        "name": "Home & Garden, Appliances & Electronics, Entertainment, General Merchandise",
        "subcategoryIds": [6, 7, 8, 1],
        "total": 0,
        "breakdown": []
      },
      "clothing-accessories-health-pharmacy": {
        "name": "Clothing, Accessories, Health & Pharmacy",
        "subcategoryIds": [3, 4, 5],
        "total": 0,
        "breakdown": []
      }
    }
  }
}
```

### Sample Requests

#### Specific Entity Calculation
```json
{
  "shoppingItems": [
    {
      "type": "Supermarkets and Other Grocery (except Convenience) Stores",
      "quantity": 100
    }
  ]
}
```

#### Average Calculation
```json
{
  "shoppingItems": [
    {
      "type": "average",
      "subcategoryGroup": "Groceries & Beverages",
      "quantity": 50
    }
  ]
}
```

#### Mixed Calculation
```json
{
  "shoppingItems": [
    {
      "type": "Supermarkets and Other Grocery (except Convenience) Stores",
      "quantity": 100
    },
    {
      "type": "average",
      "subcategoryGroup": "Clothing",
      "quantity": 200
    }
  ]
}
```

#### Case Insensitive Examples
```json
{
  "shoppingItems": [
    {
      "type": "clothing stores",
      "quantity": 150
    },
    {
      "type": "AVERAGE",
      "subcategoryGroup": "groceries-beverages",
      "quantity": 75
    }
  ]
}
```

### Subcategory Groups

The shopping calculator groups results into 3 main categories:

#### 1. Groceries & Beverages
- **Group Key**: `groceries-beverages`
- **Subcategory IDs**: [2]
- **Description**: Food and beverage retail stores

#### 2. Home & Garden, Appliances & Electronics, Entertainment, General Merchandise
- **Group Key**: `home-garden-appliances-entertainment-general`
- **Subcategory IDs**: [6, 7, 8, 1]
- **Description**: Home improvement, electronics, entertainment, and general merchandise stores

#### 3. Clothing, Accessories, Health & Pharmacy
- **Group Key**: `clothing-accessories-health-pharmacy`
- **Subcategory IDs**: [3, 4, 5]
- **Description**: Apparel, accessories, and health-related stores

### Available Shopping Entities

The shopping calculator supports 413 different shopping entities from `shopping_entities.csv`, including:

#### Groceries & Beverages
- Supermarkets and Other Grocery (except Convenience) Stores
- Convenience Stores
- Breweries
- Wineries
- Distilleries
- And more...

#### Home & Garden
- Floor Covering Stores
- Furniture Stores
- Hardware Stores
- Home Centers
- And more...

#### Clothing & Accessories
- Clothing Stores
- Shoe Stores
- Jewelry Stores
- And more...

#### Health & Pharmacy
- Pharmacies and Drug Stores
- Health and Personal Care Stores
- And more...

#### Entertainment
- Book Stores
- Sporting Goods Stores
- Musical Instrument Stores
- And more...

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

### Validation Errors (400 Bad Request)

#### Missing Required Fields
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

#### Food Calculator Validation Errors
```json
{
  "error": "Validation failed",
  "message": "Invalid food item data",
  "details": [
    "Food item 1: foodType is required",
    "Food item 2: quantity must be a positive number",
    "Food item 3: subcategoryGroup is required when foodType is \"average\""
  ]
}
```

#### Shopping Calculator Validation Errors
```json
{
  "error": "Validation failed",
  "message": "Invalid shopping item data",
  "details": [
    "Shopping item 1: type is required and must be a string",
    "Shopping item 2: subcategoryGroup is required when type is \"average\""
  ]
}
```

#### Travel Calculator Validation Errors
```json
{
  "error": "Validation failed",
  "message": "Invalid travel data",
  "details": [
    "Private transport item 1: Invalid vehicleType. Must be one of: Car, Motorbike",
    "Private transport item 1: Invalid vehicleSize. Must be one of: small, medium, large, average",
    "Private transport item 1: Invalid fuelType. Must be one of: diesel, petrol, hybrid, PHEV, BEV, electric"
  ]
}
```

#### Household Calculator Validation Errors
```json
{
  "error": "Validation failed",
  "message": "Invalid household data",
  "details": [
    "numberOfPeople is required and must be a positive number",
    "electricityUsage must be a non-negative number",
    "waterUsage must be a non-negative number",
    "wasteDisposal must be a non-negative number"
  ]
}
```

### Database Errors (500 Internal Server Error)

#### Database Connection Issues
```json
{
  "error": "Database query failed",
  "message": "Cannot convert undefined or null to object",
  "details": "Failed to fetch food data"
}
```

#### Calculation Errors
```json
{
  "error": "Food calculation failed",
  "message": "Error in calculation logic",
  "details": "Failed to calculate emissions for food item"
}
```

#### Shopping Calculation Errors
```json
{
  "error": "Shopping calculation failed",
  "message": "Invalid entity type",
  "details": "Shopping entity not found in database"
}
```

### Common Error Scenarios

#### Invalid Food Type
```json
{
  "error": "Validation failed",
  "message": "Invalid food item data",
  "details": [
    "Food item 1: foodType 'InvalidFood' not found in database"
  ]
}
```

#### Invalid Subcategory Group
```json
{
  "error": "Validation failed",
  "message": "Invalid food item data",
  "details": [
    "Food item 1: Invalid subcategoryGroup 'InvalidGroup'. Must be one of: Processed Foods and Other, Fruits, Vegetables, Red Meats, Grains, Dairy, Poultry, Seafood, Staples"
  ]
}
```

#### Missing Emission Factor
```json
{
  "error": "Database query failed",
  "message": "Emission factor not found",
  "details": "No emission factor found for the specified food item"
}
```

#### Invalid Quantity
```json
{
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": [
    "Food item 1: quantity must be a positive number",
    "Shopping item 1: quantity must be a positive number"
  ]
}
```

### Error Response Format

All error responses follow this structure:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details or array of validation errors"
}
```

### HTTP Status Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Validation failed | Invalid input data or validation errors |
| 500 | Database query failed | Database connection or query error |
| 500 | Calculation failed | Error in calculation logic |
| 500 | Internal server error | Unexpected server error |

---

## Tree Saplings Calculation

All calculators return a `treeSaplingsNeeded` field that shows how many tree saplings need to be planted for 10 years to offset the emissions.

- **Formula**: `totalEmissions / 60.5` (for food, travel, household)
- **Formula**: `totalEmissions / 22` (for shopping - different calculation)
- **Format**: 2 decimal places (e.g., "0.75", "2.99")
- **60.5 kg CO2e** = amount absorbed by one tree sapling over 10 years (food, travel, household)
- **22 kg CO2e** = amount absorbed by one tree sapling per year (shopping)

---

## Example Usage with JavaScript

### Travel Calculator Example
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

### Food Calculator Example
```javascript
// Food Calculator
const foodData = {
  foodItems: [
    {
      foodType: "Apples",
      quantity: 2
    },
    {
      foodType: "Chicken breast",
      quantity: 1.5
    },
    {
      foodType: "average",
      subcategoryGroup: "Dairy",
      quantity: 1
    }
  ]
};

const response = await fetch(`${API_BASE_URL}/calculate/food`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(foodData)
});

const result = await response.json();
console.log(`Total emissions: ${result.totalEmissions} kg CO2e`);
console.log(`Tree saplings needed: ${result.treeSaplingsNeeded}`);
```

### Shopping Calculator Example
```javascript
// Shopping Calculator
const shoppingData = {
  shoppingItems: [
    {
      type: "Supermarkets and Other Grocery (except Convenience) Stores",
      quantity: 100
    },
    {
      type: "average",
      subcategoryGroup: "Clothing",
      quantity: 200
    }
  ]
};

const response = await fetch(`${API_BASE_URL}/calculate/shopping`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(shoppingData)
});

const result = await response.json();
console.log(`Total emissions: ${result.totalEmissions} kg CO2e`);
console.log(`Tree saplings needed: ${result.treeSaplingsNeeded}`);
```

### Household Calculator Example
```javascript
// Household Calculator
const householdData = {
  numberOfPeople: 4,
  electricityUsage: 300,
  waterUsage: 15,
  wasteDisposal: 10
};

const response = await fetch(`${API_BASE_URL}/calculate/household`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(householdData)
});

const result = await response.json();
console.log(`Total emissions: ${result.totalMonthlyEmissions} kg CO2e`);
console.log(`Tree saplings needed: ${result.treeSaplingsNeeded}`);
```

### Dropdown Data Fetching Example
```javascript
// Fetch Food Dropdown Data
async function fetchFoodDropdowns() {
  const endpoints = [
    '/food-dropdown/fruits-vegetables',
    '/food-dropdown/poultry-redmeats-seafood',
    '/food-dropdown/staples-grain',
    '/food-dropdown/processed-dairy'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();
      results[endpoint] = data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
    }
  }
  
  return results;
}

// Fetch Shopping Dropdown Data
async function fetchShoppingDropdowns() {
  const endpoints = [
    '/shopping-dropdown/groceries-beverages',
    '/shopping-dropdown/home-garden-appliances-entertainment-general',
    '/shopping-dropdown/clothing-accessories-health-pharmacy'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();
      results[endpoint] = data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
    }
  }
  
  return results;
}
```

### Error Handling Example
```javascript
async function calculateEmissions(data, calculatorType) {
  try {
    const response = await fetch(`${API_BASE_URL}/calculate/${calculatorType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    if (!result.success) {
      throw new Error(`API error: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error calculating emissions:', error);
    throw error;
  }
}

// Usage
try {
  const result = await calculateEmissions(travelData, 'travel');
  console.log('Calculation successful:', result);
} catch (error) {
  console.error('Calculation failed:', error.message);
}
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

---

## Testing the APIs

### Quick Test Scripts

You can test all calculators using the provided test scripts:

```bash
# Test all calculators
node test-all-calculators.js

# Test individual calculators
node test-food-calculator.js
node test-shopping-calculator.js
node test-travel-calculator.js
node test-household-calculator.js

# Test dropdown endpoints
node test-dropdowns.js
```

### Manual Testing with curl

#### Travel Calculator Tests
```bash
# Basic travel calculation
curl -X POST http://localhost:3001/api/calculate/travel \
  -H "Content-Type: application/json" \
  -d '{
    "privateTransport": [
      {
        "vehicleType": "car",
        "vehicleSize": "small",
        "fuelType": "petrol",
        "distance": 50
      }
    ],
    "publicTransport": [
      {
        "transportType": "bus",
        "distance": 20
      }
    ]
  }'

# Case insensitive test
curl -X POST http://localhost:3001/api/calculate/travel \
  -H "Content-Type: application/json" \
  -d '{
    "privateTransport": [
      {
        "vehicleType": "CAR",
        "vehicleSize": "SMALL",
        "fuelType": "PETROL",
        "distance": 100
      }
    ]
  }'
```

#### Food Calculator Tests
```bash
# Basic food calculation
curl -X POST http://localhost:3001/api/calculate/food \
  -H "Content-Type: application/json" \
  -d '{
    "foodItems": [
      {
        "foodType": "Apples",
        "quantity": 2
      },
      {
        "foodType": "Chicken breast",
        "quantity": 1.5
      }
    ]
  }'

# Average subcategory calculation
curl -X POST http://localhost:3001/api/calculate/food \
  -H "Content-Type: application/json" \
  -d '{
    "foodItems": [
      {
        "foodType": "average",
        "subcategoryGroup": "Fruits",
        "quantity": 1
      }
    ]
  }'

# Case insensitive test
curl -X POST http://localhost:3001/api/calculate/food \
  -H "Content-Type: application/json" \
  -d '{
    "foodItems": [
      {
        "foodType": "apples",
        "quantity": 2
      }
    ]
  }'
```

#### Shopping Calculator Tests
```bash
# Basic shopping calculation
curl -X POST http://localhost:3001/api/calculate/shopping \
  -H "Content-Type: application/json" \
  -d '{
    "shoppingItems": [
      {
        "type": "Supermarkets and Other Grocery (except Convenience) Stores",
        "quantity": 100
      },
      {
        "type": "Clothing Stores",
        "quantity": 200
      }
    ]
  }'

# Average subcategory calculation
curl -X POST http://localhost:3001/api/calculate/shopping \
  -H "Content-Type: application/json" \
  -d '{
    "shoppingItems": [
      {
        "type": "average",
        "subcategoryGroup": "Groceries & Beverages",
        "quantity": 50
      }
    ]
  }'

# Case insensitive test
curl -X POST http://localhost:3001/api/calculate/shopping \
  -H "Content-Type: application/json" \
  -d '{
    "shoppingItems": [
      {
        "type": "clothing stores",
        "quantity": 150
      }
    ]
  }'
```

#### Household Calculator Tests
```bash
# Basic household calculation
curl -X POST http://localhost:3001/api/calculate/household \
  -H "Content-Type: application/json" \
  -d '{
    "numberOfPeople": 4,
    "electricityUsage": 300,
    "waterUsage": 15,
    "wasteDisposal": 10
  }'

# Minimal household calculation
curl -X POST http://localhost:3001/api/calculate/household \
  -H "Content-Type: application/json" \
  -d '{
    "numberOfPeople": 2
  }'
```

#### Dropdown Endpoint Tests
```bash
# Food dropdown endpoints
curl http://localhost:3001/api/food-dropdown/fruits-vegetables
curl http://localhost:3001/api/food-dropdown/poultry-redmeats-seafood
curl http://localhost:3001/api/food-dropdown/staples-grain
curl http://localhost:3001/api/food-dropdown/processed-dairy

# Shopping dropdown endpoints
curl http://localhost:3001/api/shopping-dropdown/groceries-beverages
curl http://localhost:3001/api/shopping-dropdown/home-garden-appliances-entertainment-general
curl http://localhost:3001/api/shopping-dropdown/clothing-accessories-health-pharmacy
```

#### Error Testing
```bash
# Invalid food type
curl -X POST http://localhost:3001/api/calculate/food \
  -H "Content-Type: application/json" \
  -d '{
    "foodItems": [
      {
        "foodType": "InvalidFood",
        "quantity": 2
      }
    ]
  }'

# Missing required fields
curl -X POST http://localhost:3001/api/calculate/household \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid quantity
curl -X POST http://localhost:3001/api/calculate/food \
  -H "Content-Type: application/json" \
  -d '{
    "foodItems": [
      {
        "foodType": "Apples",
        "quantity": -1
      }
    ]
  }'
```

### Health Check

```bash
# Check if server is running
curl http://localhost:3001/health

# Check database connection
curl http://localhost:3001/api/test-db
```

