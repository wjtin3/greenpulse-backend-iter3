

# Routing Service Documentation

## Overview

The Routing Service provides carbon emission comparison across different transport modes for any given route. It calculates the environmental impact of various travel options (cars, motorcycles, public transport, bicycles, walking) and ranks them from lowest to highest emissions.

## Features

✅ **Multi-Modal Route Comparison**
- Private vehicles (cars, motorcycles) with different sizes and fuel types
- Public transport (bus, MRT, LRT, train)
- Active transport (bicycle, walking)

✅ **Emission Calculations**
- Real emission factors from Malaysian data
- Supports petrol, diesel, hybrid, PHEV, BEV vehicles
- Different vehicle sizes (small, medium, large)

✅ **Route Analysis**
- Distance calculation using OSR

M (Open Source Routing Machine)
- Fallback to straight-line estimation
- Duration estimates for each mode

✅ **Smart Rankings**
- Routes sorted by carbon emissions (lowest first)
- Percentage comparisons vs worst option
- Carbon savings calculations

✅ **History Tracking**
- Save user comparisons
- View route history
- Statistics and insights

## API Endpoints

### 1. Compare Transport Modes

**POST** `/api/routing/compare`

Compare carbon emissions across all transport modes for a route.

**Request Body:**
```json
{
  "origin": {
    "latitude": 3.1390,
    "longitude": 101.6869
  },
  "destination": {
    "latitude": 3.1570,
    "longitude": 101.7120
  },
  "options": {
    "vehicleSizes": ["small", "medium", "large"],
    "fuelTypes": ["petrol", "diesel", "hybrid", "phev", "bev"],
    "excludePrivate": false,
    "excludePublic": false,
    "excludeActive": false
  },
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "origin": {
      "latitude": 3.1390,
      "longitude": 101.6869
    },
    "destination": {
      "latitude": 3.1570,
      "longitude": 101.7120
    },
    "directDistance": 3.2,
    "routeDistance": 4.5,
    "scenarios": [
      {
        "id": "car_small_bev",
        "mode": "car",
        "name": "Car (Small, BEV)",
        "category": "private",
        "size": "small",
        "fuelType": "bev",
        "distance": 4.5,
        "duration": 12.5,
        "emissions": 0.0,
        "emissionFactor": 0.0,
        "rank": 1,
        "emissionsVsWorst": "0.0",
        "savingsVsWorst": 1.269
      },
      {
        "id": "bicycle",
        "mode": "bicycle",
        "name": "Bicycle",
        "category": "active",
        "distance": 4.5,
        "duration": 18.0,
        "emissions": 0.0,
        "emissionFactor": 0.0,
        "rank": 2,
        "emissionsVsWorst": "0.0",
        "savingsVsWorst": 1.269
      }
    ],
    "totalScenarios": 20,
    "bestOption": {
      "id": "car_small_bev",
      "name": "Car (Small, BEV)",
      "emissions": 0.0
    },
    "worstOption": {
      "id": "car_large_petrol",
      "name": "Car (Large, Petrol)",
      "emissions": 1.269
    }
  }
}
```

---

### 2. Quick Comparison

**POST** `/api/routing/compare/quick`

Fast comparison with only key transport modes (medium cars: petrol/hybrid/bev, plus public/active transport).

**Request Body:**
```json
{
  "origin": {
    "latitude": 3.1390,
    "longitude": 101.6869
  },
  "destination": {
    "latitude": 3.1570,
    "longitude": 101.7120
  }
}
```

**Response:** Returns top 5 options only.

---

### 3. Calculate Distance

**GET** `/api/routing/distance`

Calculate straight-line distance between two points.

**Query Parameters:**
- `originLat` - Origin latitude
- `originLon` - Origin longitude
- `destLat` - Destination latitude
- `destLon` - Destination longitude

**Example:**
```bash
GET /api/routing/distance?originLat=3.1390&originLon=101.6869&destLat=3.1570&destLon=101.7120
```

**Response:**
```json
{
  "success": true,
  "data": {
    "origin": {
      "latitude": 3.1390,
      "longitude": 101.6869
    },
    "destination": {
      "latitude": 3.1570,
      "longitude": 101.7120
    },
    "distance": 3.2,
    "unit": "km"
  }
}
```

---

### 4. Calculate Emissions

**POST** `/api/routing/emissions`

Calculate emissions for a specific transport mode and distance.

**Request Body:**
```json
{
  "distance": 10.5,
  "mode": "car",
  "size": "medium",
  "fuelType": "petrol"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "car",
    "size": "medium",
    "fuelType": "petrol",
    "distance": 10.5,
    "emissionFactor": 0.192,
    "totalEmissions": 2.016,
    "unit": "kg CO2"
  }
}
```

---

### 5. Get Route History

**GET** `/api/routing/history/:userId`

Get route comparison history for a user.

**Query Parameters:**
- `limit` - Number of results (default: 10)

**Example:**
```bash
GET /api/routing/history/user123?limit=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "history": [
      {
        "id": 1,
        "origin": {
          "latitude": 3.1390,
          "longitude": 101.6869
        },
        "destination": {
          "latitude": 3.1570,
          "longitude": 101.7120
        },
        "directDistance": 3.2,
        "routeDistance": 4.5,
        "bestOptionId": "car_small_bev",
        "createdAt": "2024-10-09T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

---

### 6. Get Emission Factors

**GET** `/api/routing/emission-factors`

Get all emission factors for different transport modes.

**Response:**
```json
{
  "success": true,
  "data": {
    "factors": {
      "car_small_petrol": 0.142,
      "car_small_bev": 0.000,
      "bus": 0.089,
      "mrt": 0.023,
      "bicycle": 0.000
    },
    "unit": "kg CO2 per km"
  }
}
```

---

### 7. Health Check

**GET** `/api/routing/health`

Check routing service health and capabilities.

---

## Transport Modes

### Private Vehicles - Cars

| Size | Fuel Type | Emission Factor (kg CO2/km) |
|------|-----------|----------------------------|
| Small | Petrol | 0.142 |
| Small | Diesel | 0.125 |
| Small | Hybrid | 0.097 |
| Small | PHEV | 0.050 |
| Small | BEV | 0.000 |
| Medium | Petrol | 0.192 |
| Medium | Diesel | 0.171 |
| Medium | Hybrid | 0.121 |
| Medium | PHEV | 0.067 |
| Medium | BEV | 0.000 |
| Large | Petrol | 0.282 |
| Large | Diesel | 0.251 |
| Large | Hybrid | 0.178 |
| Large | PHEV | 0.103 |
| Large | BEV | 0.000 |

### Private Vehicles - Motorcycles

| Size | Emission Factor (kg CO2/km) |
|------|----------------------------|
| Small | 0.084 |
| Medium | 0.103 |
| Large | 0.134 |

### Public Transport

| Mode | Emission Factor (kg CO2/km) |
|------|----------------------------|
| Bus | 0.089 |
| MRT | 0.023 |
| LRT | 0.023 |
| Monorail | 0.023 |
| Train | 0.041 |

### Active Transport

| Mode | Emission Factor (kg CO2/km) |
|------|----------------------------|
| Bicycle | 0.000 |
| Walking | 0.000 |

---

## Database Schema

### Table: `route_comparisons`

Stores route comparison history.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | VARCHAR(100) | User identifier |
| origin_lat | DOUBLE PRECISION | Origin latitude |
| origin_lon | DOUBLE PRECISION | Origin longitude |
| destination_lat | DOUBLE PRECISION | Destination latitude |
| destination_lon | DOUBLE PRECISION | Destination longitude |
| direct_distance | DOUBLE PRECISION | Straight-line distance (km) |
| route_distance | DOUBLE PRECISION | Actual route distance (km) |
| scenarios | JSONB | Array of all transport scenarios |
| best_option_id | VARCHAR(100) | ID of lowest emission option |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Functions

1. **get_user_route_stats(user_id)** - Get statistics for a user's route comparisons
2. **get_popular_routes(limit)** - Get most frequently compared routes
3. **cleanup_old_route_comparisons(days)** - Remove old records

---

## Usage Examples

### Example 1: Compare Routes from Home to Office

```javascript
const response = await fetch('/api/routing/compare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: { latitude: 3.1390, longitude: 101.6869 }, // KL City Center
    destination: { latitude: 3.1570, longitude: 101.7120 }, // KLCC
    userId: 'user123'
  })
});

const data = await response.json();
console.log('Best option:', data.data.bestOption.name);
console.log('Emissions:', data.data.bestOption.emissions, 'kg CO2');
```

### Example 2: Quick Comparison for Short Distance

```javascript
const response = await fetch('/api/routing/compare/quick', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: { latitude: 3.1390, longitude: 101.6869 },
    destination: { latitude: 3.1420, longitude: 101.6900 }
  })
});

const data = await response.json();
// Returns top 5 options only
```

### Example 3: Calculate Emissions for Known Distance

```javascript
const response = await fetch('/api/routing/emissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    distance: 25.5,
    mode: 'car',
    size: 'medium',
    fuelType: 'hybrid'
  })
});

const data = await response.json();
console.log('Total emissions:', data.data.totalEmissions, 'kg CO2');
```

---

## Setup

### 1. Database Setup

```bash
npm run setup-routing
```

Or manually:
```bash
node scripts/setupRoutingSchema.js
```

### 2. Test the API

```bash
npm run test-routing
```

---

## Integration with Existing Calculator

The routing service complements your existing travel calculator by:

1. **Pre-calculation**: Show users emission comparisons before they input data
2. **Route Planning**: Help users choose the greenest transport mode
3. **Visual Comparison**: Display options in descending order of emissions
4. **Historical Data**: Track user's green transport choices

---

## Performance Considerations

1. **Route Calculation**: Uses OSRM (free, open-source) with fallback to straight-line estimation
2. **Caching**: Consider caching popular routes
3. **Optimization**: Quick comparison endpoint for faster results
4. **Database**: Indexes on common query patterns

---

## Limitations

1. **Public Transport Routes**: Currently estimates based on road distance - actual routes may vary
2. **Traffic**: Duration estimates don't account for real-time traffic
3. **Multi-leg Journeys**: Single-mode only - no mixed transport options yet
4. **OSRM**: Using demo server - consider self-hosting for production

---

## Future Enhancements

- [ ] Real-time public transport routes (integrate with GTFS data)
- [ ] Traffic-aware duration estimates
- [ ] Multi-leg journey support
- [ ] Carbon offset suggestions
- [ ] Route optimization for lowest emissions
- [ ] Integration with real-time vehicle positions
- [ ] Carpooling emission calculations

---

## Support

For questions or issues:
1. Check API health: `GET /api/routing/health`
2. Review emission factors: `GET /api/routing/emission-factors`
3. Test with quick comparison first
4. Check server logs for detailed errors

---

## Data Sources

- **Emission Factors**: Based on Malaysian transport data
- **Routing**: Open Source Routing Machine (OSRM)
- **Distance Calculation**: Haversine formula for geodesic distance

---

## License & Attribution

When using this service:
- Emission factors based on Malaysian government data
- OSRM: Open Source Routing Machine
- GreenPulse Carbon Calculator integration


