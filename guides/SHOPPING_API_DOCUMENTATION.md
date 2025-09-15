# Shopping API Documentation

## Overview

The Shopping APIs provide comprehensive functionality for shopping-related carbon footprint calculations, including dropdown data for frontend integration and emission calculations with subcategory grouping.

## Base URL

```
http://localhost:3001/api
```

## Table of Contents

1. [Shopping Calculator API](#shopping-calculator-api)
2. [Shopping Dropdown APIs](#shopping-dropdown-apis)
3. [Response Formats](#response-formats)
4. [Error Handling](#error-handling)
5. [Sample Requests](#sample-requests)
6. [Subcategory Groups](#subcategory-groups)
7. [Available Shopping Entities](#available-shopping-entities)

---

## Shopping Calculator API

### Calculate Shopping Carbon Footprint

**Endpoint:** `POST /calculate/shopping`

**Description:** Calculates carbon emissions for shopping activities using specific entities or average subcategory values.

**Request Body:**
```json
{
  "shoppingItems": [
    {
      "type": "string",
      "quantity": number
    },
    {
      "type": "average",
      "subcategoryGroup": "string",
      "quantity": number
    }
  ]
}
```

**Parameters:**
- `type` (string, required): Either a specific entity name from `shopping_entities.csv` or "average"
- `quantity` (number, required): Amount in RM (Malaysian Ringgit)
- `subcategoryGroup` (string, required when type="average"): One of the valid subcategory groups

**Valid Subcategory Groups for "average" type:**
- `"groceries-beverages"`
- `"home-garden-appliances-entertainment-general"`
- `"clothing-accessories-health-pharmacy"`

**Response:**
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

---

## Shopping Dropdown APIs

### 1. Groceries & Beverages Dropdown

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

### 2. Home & Garden, Appliances & Electronics, Entertainment, General Merchandise Dropdown

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

### 3. Clothing, Accessories, Health & Pharmacy Dropdown

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

---

## Response Formats

### Success Response
All successful responses include:
- `success`: true
- `data`: Array of shopping entities (for dropdown APIs)
- `count`: Number of entities returned (for dropdown APIs)
- `subcategories`: Array of subcategory names (for dropdown APIs)

### Error Response
```json
{
  "error": "Error type",
  "message": "Error description",
  "details": "Additional error details"
}
```

---

## Error Handling

### Common Error Types

1. **Validation Errors (400)**
   - Missing required fields
   - Invalid data types
   - Invalid subcategory groups

2. **Database Errors (500)**
   - Connection issues
   - Query failures

3. **Calculation Errors (500)**
   - Invalid entity types
   - Missing emission factors

### Example Error Response
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

---

## Sample Requests

### 1. Specific Entity Calculation
```bash
curl -X POST http://localhost:3001/api/calculate/shopping \
  -H "Content-Type: application/json" \
  -d '{
    "shoppingItems": [
      {
        "type": "Supermarkets and Other Grocery (except Convenience) Stores",
        "quantity": 100
      }
    ]
  }'
```

### 2. Average Calculation
```bash
curl -X POST http://localhost:3001/api/calculate/shopping \
  -H "Content-Type: application/json" \
  -d '{
    "shoppingItems": [
      {
        "type": "average",
        "subcategoryGroup": "groceries-beverages",
        "quantity": 50
      }
    ]
  }'
```

### 3. Mixed Calculation
```bash
curl -X POST http://localhost:3001/api/calculate/shopping \
  -H "Content-Type: application/json" \
  -d '{
    "shoppingItems": [
      {
        "type": "Supermarkets and Other Grocery (except Convenience) Stores",
        "quantity": 100
      },
      {
        "type": "average",
        "subcategoryGroup": "clothing-accessories-health-pharmacy",
        "quantity": 200
      }
    ]
  }'
```

### 4. Get Dropdown Data
```bash
curl http://localhost:3001/api/shopping-dropdown/groceries-beverages
```

---

## Subcategory Groups

The shopping calculator groups results into 3 main categories:

### 1. Groceries & Beverages
- **Group Key**: `groceries-beverages`
- **Subcategory IDs**: [2]
- **Description**: Food and beverage retail stores

### 2. Home & Garden, Appliances & Electronics, Entertainment, General Merchandise
- **Group Key**: `home-garden-appliances-entertainment-general`
- **Subcategory IDs**: [6, 7, 8, 1]
- **Description**: Home improvement, electronics, entertainment, and general merchandise stores

### 3. Clothing, Accessories, Health & Pharmacy
- **Group Key**: `clothing-accessories-health-pharmacy`
- **Subcategory IDs**: [3, 4, 5]
- **Description**: Apparel, accessories, and health-related stores

---

## Available Shopping Entities

The shopping calculator supports 413 different shopping entities from `shopping_entities.csv`, including:

### Groceries & Beverages
- Supermarkets and Other Grocery (except Convenience) Stores
- Convenience Stores
- Breweries
- Wineries
- Distilleries
- And more...

### Home & Garden
- Floor Covering Stores
- Furniture Stores
- Hardware Stores
- Home Centers
- And more...

### Clothing & Accessories
- Clothing Stores
- Shoe Stores
- Jewelry Stores
- And more...

### Health & Pharmacy
- Pharmacies and Drug Stores
- Health and Personal Care Stores
- And more...

### Entertainment
- Book Stores
- Sporting Goods Stores
- Musical Instrument Stores
- And more...

---

## Notes

- All amounts are assumed to be in RM (Malaysian Ringgit)
- Type matching is case-insensitive
- Average calculations use `average_emission` from `shopping_subcategories.csv`
- Specific entity calculations use emission factors from `shopping_emission_factors.csv`
- Tree saplings calculation: 1 tree = 22 kg CO2e per year
