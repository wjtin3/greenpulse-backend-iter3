# Food Calculator API Documentation

## Overview

The Food Calculator API provides comprehensive carbon footprint calculations for food items with subcategory-based grouping and dropdown population for frontend integration.

## Base URL

```
http://localhost:3001/api
```

## Table of Contents

1. [Food Calculator API](#food-calculator-api)
2. [Food Dropdown APIs](#food-dropdown-apis)
3. [Response Formats](#response-formats)
4. [Error Handling](#error-handling)
5. [Sample Requests](#sample-requests)
6. [Subcategory Groups](#subcategory-groups)

---

## Food Calculator API

### Calculate Food Carbon Footprint

**Endpoint:** `POST /calculate/food`

**Description:** Calculates carbon emissions for food items with subcategory-based grouping.

**Request Body:**
```json
{
  "foodItems": [
    {
      "foodType": "string",           // Required: Food item name or "average"
      "quantity": number,             // Required: Quantity in kg
      "subcategoryGroup": "string"    // Optional: Required only when foodType is "average"
    }
  ]
}
```

**Parameters:**
- `foodType`: Either a specific food item name (e.g., "Apples", "Chicken breast") or "average" for subcategory average
  - **Case Insensitive**: "apples", "APPLES", "Apples" all work
- `quantity`: Amount in kilograms (positive number)
- `subcategoryGroup`: Required when `foodType` is "average". Valid values (case insensitive):
  - `"Processed Foods and Other"` (average_emission: 3.294652)
  - `"Fruits"` (average_emission: 2.076779)
  - `"Vegetables"` (average_emission: 1.290623)
  - `"Red Meats"` (average_emission: 32.04116)
  - `"Grains"` (average_emission: 1.922192)
  - `"Dairy"` (average_emission: 16.838281)
  - `"Poultry"` (average_emission: 6.16699)
  - `"Seafood"` (average_emission: 11.00683)
  - `"Staples"` (average_emission: 2.247703)

**Response:**
```json
{
  "success": true,
  "totalEmissions": 18.8491025,
  "treeSaplingsNeeded": "0.31",
  "results": {
    "total": 18.8491025,
    "breakdown": [
      {
        "foodType": "Apples",
        "quantity": 2,
        "subcategory": "Fruits",
        "group": "Fruits, Vegetables",
        "emissionFactor": "0.507354",
        "emissions": 1.014708
      }
    ],
    "groups": {
      "fruits-vegetables": {
        "name": "Fruits, Vegetables",
        "total": 1.014708,
        "breakdown": [...]
      },
      "poultry-redmeats-seafood": {
        "name": "Poultry, Red Meats, Seafood",
        "total": 13.9084845,
        "breakdown": [...]
      },
      "staples-grain": {
        "name": "Staples, Grain",
        "total": 3.92591,
        "breakdown": [...]
      },
      "processed-dairy": {
        "name": "Processed Foods and Other, Dairy",
        "total": 0,
        "breakdown": []
      }
    }
  }
}
```

---

## Food Dropdown APIs

### 1. Fruits & Vegetables Dropdown

**Endpoint:** `GET /food-dropdown/fruits-vegetables`

**Description:** Returns all food entities from Fruits and Vegetables subcategories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "name": "Apples",
      "subcategory": "Fruits"
    },
    {
      "id": 9,
      "name": "Asparagus",
      "subcategory": "Vegetables"
    }
  ],
  "count": 36,
  "subcategories": ["Fruits", "Vegetables"]
}
```

### 2. Poultry, Red Meats & Seafood Dropdown

**Endpoint:** `GET /food-dropdown/poultry-redmeats-seafood`

**Description:** Returns all food entities from Poultry, Red Meats, and Seafood subcategories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "name": "Chicken breast",
      "subcategory": "Poultry"
    },
    {
      "id": 11,
      "name": "Bacon",
      "subcategory": "Red Meats"
    },
    {
      "id": 63,
      "name": "Cod",
      "subcategory": "Seafood"
    }
  ],
  "count": 36,
  "subcategories": ["Poultry", "Red Meats", "Seafood"]
}
```

### 3. Staples & Grain Dropdown

**Endpoint:** `GET /food-dropdown/staples-grain`

**Description:** Returns all food entities from Staples and Grains subcategories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 116,
      "name": "Lentils",
      "subcategory": "Staples"
    },
    {
      "id": 12,
      "name": "Bagels",
      "subcategory": "Grains"
    }
  ],
  "count": 20,
  "subcategories": ["Staples", "Grains"]
}
```

### 4. Processed Foods & Dairy Dropdown

**Endpoint:** `GET /food-dropdown/processed-dairy`

**Description:** Returns all food entities from Processed Foods and Other, and Dairy subcategories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ale",
      "subcategory": "Processed Foods and Other"
    },
    {
      "id": 26,
      "name": "Blue cheese",
      "subcategory": "Dairy"
    }
  ],
  "count": 119,
  "subcategories": ["Processed Foods and Other", "Dairy"]
}
```

---

## Response Formats

### Success Response
All successful responses include:
- `success`: `true`
- `data`: Array of food items (for dropdown APIs)
- `count`: Number of items returned
- `subcategories`: Array of subcategory names included

### Food Calculator Response
- `success`: `true`
- `totalEmissions`: Total CO2e emissions in kg
- `treeSaplingsNeeded`: Number of tree saplings needed (total/60.5)
- `results`: Detailed breakdown object
  - `total`: Total emissions
  - `breakdown`: Array of individual item calculations
  - `groups`: Object with totals for each subcategory group

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details"
}
```

---

## Error Handling

### Common Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Validation failed | Invalid request data |
| 500 | Database query failed | Database connection or query error |
| 500 | Food calculation failed | Error in calculation logic |

### Validation Errors

**Missing foodType:**
```json
{
  "error": "Validation failed",
  "message": "Invalid food item data",
  "details": ["Food item 1: foodType is required"]
}
```

**Invalid quantity:**
```json
{
  "error": "Validation failed",
  "message": "Invalid food item data",
  "details": ["Food item 1: quantity must be a positive number"]
}
```

**Database errors:**
```json
{
  "error": "Database query failed",
  "message": "Cannot convert undefined or null to object",
  "details": "Failed to fetch food data"
}
```

---

## Sample Requests

### 1. Single Food Item
```json
{
  "foodItems": [
    {
      "foodType": "Apples",
      "quantity": 2
    }
  ]
}
```

### 2. Multiple Items from Different Groups
```json
{
  "foodItems": [
    {
      "foodType": "Apples",
      "quantity": 2
    },
    {
      "foodType": "Chicken breast",
      "quantity": 1.5
    },
    {
      "foodType": "Rice",
      "quantity": 1
    },
    {
      "foodType": "Milk",
      "quantity": 2
    }
  ]
}
```

### 3. Average Subcategory Calculation
```json
{
  "foodItems": [
    {
      "foodType": "average",
      "subcategoryGroup": "Fruits",
      "quantity": 1
    }
  ]
}
```

### 4. Mixed Specific and Average Items
```json
{
  "foodItems": [
    {
      "foodType": "Beef steak",
      "quantity": 0.5
    },
    {
      "foodType": "average",
      "subcategoryGroup": "Dairy",
      "quantity": 1
    },
    {
      "foodType": "Bread",
      "quantity": 2
    }
  ]
}
```

### 5. Case Insensitive Examples
```json
{
  "foodItems": [
    {
      "foodType": "apples",
      "quantity": 2
    },
    {
      "foodType": "CHICKEN BREAST",
      "quantity": 1.5
    },
    {
      "foodType": "average",
      "subcategoryGroup": "Fruits",
      "quantity": 1
    }
  ]
}
```

---

## Subcategory Groups

### 1. Fruits, Vegetables
- **Subcategory IDs:** 2, 3
- **Subcategories:** Fruits, Vegetables
- **Sample Items:** Apples, Bananas, Carrots, Broccoli, Potatoes

### 2. Poultry, Red Meats, Seafood
- **Subcategory IDs:** 7, 4, 8
- **Subcategories:** Poultry, Red Meats, Seafood
- **Sample Items:** Chicken breast, Beef steak, Salmon, Cod

### 3. Staples, Grain
- **Subcategory IDs:** 9, 5
- **Subcategories:** Staples, Grains
- **Sample Items:** Rice, Bread, Pasta, Lentils

### 4. Processed Foods and Other, Dairy
- **Subcategory IDs:** 1, 6
- **Subcategories:** Processed Foods and Other, Dairy
- **Sample Items:** Milk, Cheese, Chocolate, Nuts

---

## Available Food Items

### Fruits & Vegetables (36 items)
**Fruits:** Apples, Bananas, Cherry tomatoes, Grapes, Kiwis, Lemons, Limes, Melon, Oranges, Pears, Pineapple, Raspberries, Strawberries, Watermelon

**Vegetables:** Asparagus, Avocados, Beans, Beetroot, Broccoli, Cabbage, Carrots, Cauliflower, Courgettes, Cucumber, Garden peas, Kale, Lettuce, Mushrooms, Onions, Parsnips, Peppers, Potatoes, Spinach, Sweetcorn, Tomatoes

### Poultry, Red Meats & Seafood (36 items)
**Poultry:** Chicken breast, Chicken burger, Chicken curry, Chicken noodles, Chicken pasta, Chicken sausages, Chicken thighs, Chicken wings, Eggs, Sausage rolls

**Red Meats:** Bacon, Beef burger, Beef curry, Beef meatballs, Beef mince, Beef noodles, Beef steak, Lamb (leg), Lamb Hotpot, Lamb burgers, Lamb casserole, Lamb chops, Lamb curry, Lamb moussaka, Pork chops, Pork loin, Pork sausage rolls, Pork sausages

**Seafood:** Cod, Cod fish fingers, Haddock risotto, Mackerel, Prawn crackers, Prawns, Salmon, Tuna

### Staples & Grain (20 items)
**Staples:** Lentils, Naan, Potato croquettes, Quiche

**Grains:** Bagels, Baguette, Bread, Couscous, Egg noodles, Lasagne sheets, Pasta shells, Penne pasta, Pitta bread, Porridge (oatmeal), Quinoa, Rice, Rice noodles, Sourdough bread, Spaghetti, Spaghetti bolognese

### Processed Foods & Dairy (119 items)
**Processed Foods:** Ale, Almond butter, Almond milk, Almonds, Apple juice, Apple pie, Apricot jam, Beer, Biscuits, Brazil nuts, Breakfast cereal, Caesar salad, Carrot cake, Cashew nuts, Cereal bars, Cheesecake, Chia seeds, Chickpeas, Chilli con carne, Chocolate biscuits, Chocolate cake, Chocolate cereals, Chocolate cheesecake, Chocolate spread, Cider, Coconut milk, Coconut oil, Cod fishcakes, Cookies, Cottage pie, Cracker biscuits, Crisps, Croissants, Dairy-free cheese, Dairy-free ice cream, Dark chocolate, Doughnuts, Falafels, Flapjack, Frozen chips, Frozen jacket potatoes, Frozen mashed potato, Frozen onion rings, Frozen potato wedges, Frozen roast potatoes, Frozen sweet potato fries, Fruit cake, Fruit smoothies, Granola, Ice cream, Ice lollies, Instant coffee, Macaroni cheese, Marmalade, Meat pizza, Meat-free burger, Meat-free mince, Meat-free nuggets, Meat-free sausages, Milk chocolate, Mixed salad, Muesli, Muffins, Oat milk, Olive oil, Orange juice, Pain au chocolat, Pancakes, Peanut butter, Peanuts, Pecan nuts, Popcorn, Poppadoms, Protein bar, Protein shake, Pumpkin seeds, Rapeseed oil, Raspberry jam, Rice milk, Salmon fishcakes, Shepherd's pie, Shortbread biscuits, Soy desert, Soy milk, Soy yoghurt, Sponge cake, Steak pie, Strawberry jam, Sugar, Sunflower oil, Sunflower seeds, Tea, Tofu, Tomato ketchup, Tortilla wraps, Vegan pizza, Vegetable lasagne, Vegetarian chilli con carne, Vegetarian curry, Vegetarian pizza, Walnuts, Wine, Yoghurt

**Dairy:** Blue cheese, Brie, Butter, Camembert, Cheddar cheese, Coffee beans, Coffee pods, Cottage cheese, Cow's milk, Feta cheese, Goat's cheese, Halloumi cheese, Mozzarella cheese, Parmesan cheese, Ricotta cheese

---

## Testing with Postman

### Collection Setup
1. **Method:** `POST` for calculator, `GET` for dropdowns
2. **Base URL:** `http://localhost:3001/api`
3. **Headers:** `Content-Type: application/json`
4. **Body:** Select "raw" and "JSON" format for POST requests

### Test Scenarios
1. **Basic Calculation:** Single food item
2. **Multi-Group Calculation:** Items from different subcategory groups
3. **Average Calculation:** Using subcategory averages
4. **Mixed Calculation:** Specific items + averages
5. **Error Testing:** Invalid data, missing fields
6. **Dropdown Testing:** All four dropdown endpoints

---

## Case Insensitive Support

The API supports case insensitive matching for:
- **Food Type Names**: "apples", "APPLES", "Apples" all work
- **Subcategory Groups**: "fruits-vegetables", "FRUITS-VEGETABLES", "Fruits, Vegetables" all work
- **Average Type**: "average", "AVERAGE", "Average" all work

### Examples:
```json
// All of these work:
{"foodType": "apples", "quantity": 2}
{"foodType": "APPLES", "quantity": 2}
{"foodType": "Apples", "quantity": 2}

// All of these work for subcategory names:
{"foodType": "average", "subcategoryGroup": "Fruits", "quantity": 1}
{"foodType": "average", "subcategoryGroup": "fruits", "quantity": 1}
{"foodType": "average", "subcategoryGroup": "FRUITS", "quantity": 1}
```

## Notes

- All quantities are assumed to be in kilograms
- Emission factors are in kg CO2e/kg
- Tree saplings calculation: total emissions ÷ 60.5
- Food items are case-insensitive
- Subcategory groups are case-insensitive
- Results are sorted alphabetically by food name
- Database connection is required for all operations
- Server must be running on port 3001 for local testing
