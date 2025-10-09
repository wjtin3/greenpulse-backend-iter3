# 🔄 Public Transport Transfer Routing Implementation

## Overview

The GreenPulse backend now supports comprehensive public transport routing with **multi-leg transfer journeys** and **intelligent stop recommendations**.

---

## ✨ What's New

### 1. Transfer Route Planning

The system can now plan complex journeys that require transfers between different transit services:

- **Same-System Transfers**: Take Bus 100 to Station A, transfer to Bus 200
- **Cross-System Transfers**: Take Bus to MRT station, transfer to MRT line
- **Walking Transfers**: Calculates walking distance and time between transfer points
- **Multi-Leg Journeys**: Up to 2 transit legs per route with one transfer

### 2. Nearest Stop Display

When origin or destination is beyond walking distance (>1.5km), the system now:
- Searches for nearest stops within 5km radius
- Returns list of nearest stops with distances
- Provides actionable suggestions (e.g., "take a taxi to the nearest stop")
- Shows stop details: name, ID, distance, category, coordinates

---

## 🔧 How It Works

### Step 1: Check Walking Distance
```
Origin/Destination → Find stops within 1.5km
├─ Found? → Continue with routing
└─ Not Found? → Search up to 5km → Return nearest stops
```

### Step 2: Find Direct Routes
```
For each nearby stop pair:
  Query GTFS database for direct connections
  ├─ Route found? → Add to route options
  └─ No route? → Continue to transfers
```

### Step 3: Find Transfer Routes
```
For each nearby stop pair:
  If same category:
    ├─ Find intermediate stops on origin routes
    └─ Check if intermediate stop has route to destination
  
  If different categories:
    ├─ Find all reachable stops from origin
    ├─ Find nearby stops (<500m) in destination category
    └─ Check if those stops have route to destination
```

### Step 4: Process & Sort Results
```
All routes → Calculate:
  ├─ Total distance (walk + transit + walk)
  ├─ Total duration (walk + transit + transfer + transit + walk)
  ├─ Total emissions (transit segments only)
  
Sort by:
  ├─ If same type → Sort by duration
  ├─ If similar duration (<10min) → Prefer direct
  └─ Otherwise → Sort by duration
```

---

## 📡 API Endpoints

### POST `/api/routing/transit/plan`

Plans a public transport route with transfers.

**Request:**
```json
{
  "origin": { "latitude": 3.1390, "longitude": 101.6869 },
  "destination": { "latitude": 3.1570, "longitude": 101.7120 }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "origin": { "latitude": 3.1390, "longitude": 101.6869 },
    "destination": { "latitude": 3.1570, "longitude": 101.7120 },
    "routes": [
      {
        "type": "direct",
        "totalDistance": 4.83,
        "totalDuration": 14.14,
        "totalEmissions": 0.093,
        "steps": [...]
      },
      {
        "type": "transfer",
        "totalDistance": 5.12,
        "totalDuration": 18.54,
        "totalEmissions": 0.196,
        "transferPoint": "KL SENTRAL",
        "steps": [...]
      }
    ],
    "directRoutes": [...],
    "transferRoutes": [...],
    "totalRoutes": 23,
    "bestRoute": {...},
    "routeTypes": {
      "direct": 3,
      "transfer": 20
    }
  }
}
```

**Response (Too Far from Stops):**
```json
{
  "success": false,
  "error": "No stops within walking distance of origin (1.5km)",
  "data": {
    "nearestOriginStops": [
      {
        "name": "PASAR SENI",
        "stopId": "KJ14",
        "distance": 2.34,
        "category": "rapid-rail-kl",
        "location": {
          "latitude": 3.14220,
          "longitude": 101.69510
        }
      }
    ],
    "suggestion": "Nearest stop is \"PASAR SENI\" (2.34km away). Consider taking a taxi/ride to the stop first."
  }
}
```

---

## 🎯 Route Types

### Direct Route
```
Walk → Transit → Walk
```
**Example:**
1. 🚶 Walk 500m to KL SENTRAL (6 min)
2. 🚇 Take LRT to KLCC (5 min, 0.093 kg CO₂)
3. 🚶 Walk 250m to destination (3 min)

**Total:** 14 minutes, 0.093 kg CO₂

### Transfer Route (Same Category)
```
Walk → Transit 1 → Transfer → Transit 2 → Walk
```
**Example:**
1. 🚶 Walk 400m to Bus Stop A (5 min)
2. 🚌 Take Bus 100 to Station B (8 min, 0.071 kg CO₂)
3. 🔄 Transfer at Station B (3 min)
4. 🚌 Take Bus 200 to Stop C (6 min, 0.053 kg CO₂)
5. 🚶 Walk 300m to destination (4 min)

**Total:** 26 minutes, 0.124 kg CO₂

### Transfer Route (Cross-Category)
```
Walk → Bus → Walk Transfer → MRT → Walk
```
**Example:**
1. 🚶 Walk 350m to Bus Stop (4 min)
2. 🚌 Take Bus 402 to Ampang Park (2 min, 0.089 kg CO₂)
3. 🔄 Walk 14m to LRT station (5 min)
4. 🚇 Take LRT to KLCC (6 min, 0.106 kg CO₂)
5. 🚶 Walk 150m to destination (2 min)

**Total:** 19 minutes, 0.195 kg CO₂

---

## 🎨 Step Types

### Walk Step
```json
{
  "type": "walk",
  "instruction": "Walk to KL SENTRAL",
  "distance": 0.514,
  "duration": 6.17,
  "from": { "latitude": 3.139, "longitude": 101.6869 },
  "to": {
    "latitude": 3.13442,
    "longitude": 101.68625,
    "name": "KL SENTRAL",
    "stopId": "KJ15"
  }
}
```

### Transit Step
```json
{
  "type": "transit",
  "mode": "mrt",
  "instruction": "Take KJL towards Gombak",
  "routeId": "KJ",
  "routeName": "KJL",
  "routeLongName": "LRT Kelana Jaya Line",
  "headsign": "From Putra Heights to Gombak",
  "boardStop": {
    "stopId": "KJ15",
    "name": "KL SENTRAL",
    "latitude": 3.13442,
    "longitude": 101.68625
  },
  "alightStop": {
    "stopId": "KJ10",
    "name": "KLCC",
    "latitude": 3.15894,
    "longitude": 101.71329
  },
  "distance": 4.05,
  "duration": 4.87,
  "emissions": 0.093,
  "category": "rapid-rail-kl"
}
```

### Transfer Step
```json
{
  "type": "transfer",
  "instruction": "Walk to connecting stop (transfer from rapid-bus-kl to rapid-rail-kl)",
  "distance": 0.014,
  "duration": 5.17,
  "from": {
    "latitude": 3.15996,
    "longitude": 101.71912,
    "name": "LRT AMPANG PARK (OPP)"
  },
  "to": {
    "latitude": 3.15996,
    "longitude": 101.71912,
    "name": "LRT AMPANG PARK (OPP)"
  }
}
```

---

## ⚙️ Configuration

### Adjustable Parameters

Located in `services/transitRoutingService.js`:

```javascript
constructor() {
  // Maximum walking distance to/from stops
  this.maxWalkingDistance = 1.5; // km
  
  // Maximum search radius for nearest stops
  const maxSearchRadius = 5.0; // km
  
  // Number of stops to find
  const stopsToFind = 5;
  
  // Number of stop combinations to try
  const originStopsToCheck = 3;
  const destStopsToCheck = 3;
  // Total combinations: 3 × 3 = 9
  
  // Walking speed
  this.walkingSpeed = 5; // km/h
  
  // Transfer times
  const sameStopTransfer = 3; // minutes
  const walkingTransfer = 5; // minutes (+ walking time)
  
  // Cross-system transfer distance
  const maxTransferDistance = 0.5; // km
}
```

### Emission Factors

```javascript
this.emissionFactors = {
  bus: 0.089,      // kg CO₂/km
  mrt: 0.023,      // kg CO₂/km
  lrt: 0.023,      // kg CO₂/km
  monorail: 0.023, // kg CO₂/km
  train: 0.041     // kg CO₂/km
};
```

---

## 🧪 Testing

### Test the Transit Routing

Open `public/transit-test.html` in a browser:

1. **Preset Routes**: Click preset buttons to test known routes
2. **Manual Input**: Enter custom coordinates
3. **View Results**: See direct and transfer routes with step-by-step directions
4. **Inspect Details**: Each step shows distance, duration, emissions

### Test with API

```bash
# Test direct route (KL Sentral to KLCC)
curl -X POST "http://localhost:3001/api/routing/transit/plan" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"latitude": 3.1390, "longitude": 101.6869},
    "destination": {"latitude": 3.1570, "longitude": 101.7120}
  }'

# Test transfer route (requires bus to MRT)
curl -X POST "http://localhost:3001/api/routing/transit/plan" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"latitude": 3.11, "longitude": 101.66},
    "destination": {"latitude": 3.16, "longitude": 101.72}
  }'

# Test too far from stops
curl -X POST "http://localhost:3001/api/routing/transit/plan" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"latitude": 2.9, "longitude": 101.5},
    "destination": {"latitude": 3.0, "longitude": 101.6}
  }'
```

---

## 📊 Performance Considerations

### Database Queries

**Direct Routes:** ~2-3 queries per stop pair
- Find routes between stops
- Get stop details
- Get route information

**Transfer Routes:** ~10-15 queries per stop pair
- Find first leg routes
- Find intermediate/transfer stops
- Find second leg routes
- Get all stop and route details

**Optimization:**
- Limit to top 3 origin and destination stops
- Limit intermediate stops to 10-20
- Limit transfer combinations to 5
- Use indexed columns (stop_id, route_id, stop_sequence)

### Response Times

| Scenario | Queries | Time |
|----------|---------|------|
| Direct routes only | ~20-30 | <500ms |
| With transfers | ~100-150 | <2s |
| No routes found | ~50-80 | <1s |
| Too far (nearest stops) | ~10-15 | <300ms |

---

## 🐛 Troubleshooting

### "No routes found" but stops exist

**Cause:** Stops are on different systems with no connecting routes

**Solution:**
- Check if GTFS data is complete
- Verify route connections in database
- Check stop sequences are correct
- May need to adjust transfer search parameters

### Transfer routes not showing

**Cause:** Transfer logic may not find intermediate stops

**Solution:**
- Increase `maxTransferDistance` (currently 0.5km)
- Increase number of intermediate stops to check
- Verify route_type mapping is correct

### Too many duplicate routes

**Cause:** Multiple trips on same route

**Solution:**
- Add DISTINCT to queries
- Filter by headsign/direction
- Limit results earlier in the query

---

## 🎉 Success Metrics

✅ **Transfer routing working:**
- Same-category transfers (bus to bus)
- Cross-category transfers (bus to MRT)
- Walking transfer distances calculated
- Transfer times included

✅ **Nearest stops feature:**
- Shows stops up to 5km away
- Provides actionable suggestions
- Includes all relevant stop details

✅ **Route sorting:**
- Prefers direct routes when possible
- Sorts by duration
- Categorizes by type

✅ **Step-by-step directions:**
- Walk, transit, and transfer steps
- Stop IDs and names
- Route information
- Carbon emissions

---

## 🚀 Next Steps

### Potential Enhancements

1. **Real-time Integration**
   - Use GTFS Realtime data for live schedules
   - Show actual arrival/departure times
   - Account for delays

2. **Multiple Transfers**
   - Support 2+ transfers per route
   - More complex journey planning
   - International transfer standards

3. **Schedule Integration**
   - Use calendar and frequencies tables
   - Show next available departure
   - Filter by time of day

4. **Fare Calculation**
   - Add fare_attributes and fare_rules
   - Calculate journey cost
   - Show fare zones

5. **Accessibility**
   - Filter wheelchair-accessible routes
   - Show elevator/ramp availability
   - Audio/visual assistance info

---

## 📝 Summary

The transit routing system now provides:
- ✅ Direct public transport routes
- ✅ Multi-leg transfer routes
- ✅ Same-system and cross-system transfers
- ✅ Walking segments and transfer times
- ✅ Nearest stop recommendations
- ✅ Carbon emission calculations
- ✅ Step-by-step directions
- ✅ Comprehensive test interface

All features are production-ready and tested! 🎉

