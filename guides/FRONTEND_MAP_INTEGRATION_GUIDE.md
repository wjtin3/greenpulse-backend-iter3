# Frontend Map Integration Guide

This guide provides everything you need to integrate the GreenPulse Google Maps routing interface into your Vue/React/Angular frontend.

---

## 📋 Prerequisites

### 1. Backend APIs Required

Your backend server must be running and accessible. The map requires these API endpoints:

#### **Core APIs:**

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/config/maps-key` | GET | Get Google Maps API key | `{ apiKey: string }` |
| `/api/routing/compare` | POST | Get private vehicle routes | `{ routes: Route[] }` |
| `/api/routing/transit/plan` | POST | Get public transit routes | `{ routes: TransitRoute[] }` |
| `/api/routing/realtime/vehicles-for-route` | GET | Get live vehicle positions | `{ vehicles: Vehicle[] }` |
| `/api/gtfs/realtime/vehicles/:category` | GET | Background refresh endpoint | `{ count: number, vehicles: Vehicle[] }` |

---

## 🔑 Required Environment Variables

Add these to your `.env` file:

```env
# Google Maps API Key (REQUIRED)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Database Connection (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/database

# Server Configuration
API_PORT=3001
NODE_ENV=production

# CORS (if frontend on different domain)
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Getting Google Maps API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
4. Create API credentials (API Key)
5. Add restrictions (recommended):
   - HTTP referrers: `your-frontend-domain.com/*`
   - API restrictions: Maps JavaScript API, Places API, Geocoding API

**Cost:** Google Maps offers $200 free credit/month ([Pricing Calculator](https://mapsplatform.google.com/pricing/))

---

## 📦 Backend Setup

### 1. Install Dependencies

```bash
npm install express cors helmet express-rate-limit pg
```

### 2. Database Schema

Run these scripts to set up required tables:

```bash
# Setup GTFS data
node scripts/importGTFS.js

# Setup real-time vehicle tracking
node scripts/setupRealtimeSchema.js

# Setup route caching
node scripts/setupRouteCache.js

# (Optional) Import KTMB train data
node scripts/importKTMBData.js
```

### 3. Start Backend Server

```bash
npm start
```

Server should be running on `http://localhost:3001` (or your configured port).

---

## 🎨 Frontend Integration Options

### **Option 1: Embed as Iframe** ⭐ (Easiest)

```html
<iframe 
  src="http://localhost:3001/google-map-routing.html" 
  width="100%" 
  height="800px"
  style="border: none; border-radius: 10px;">
</iframe>
```

**Pros:**
- ✅ Zero configuration
- ✅ Works immediately
- ✅ No code changes needed

**Cons:**
- ❌ Limited styling control
- ❌ Communication requires postMessage
- ❌ Separate scrolling context

---

### **Option 2: Component Integration** (Vue/React/Angular)

Copy the HTML file logic into your component framework.

#### **Vue 3 Example:**

```vue
<template>
  <div class="map-routing-container">
    <div class="sidebar">
      <!-- Origin/Destination inputs -->
      <input 
        v-model="origin" 
        @input="findRoutes"
        placeholder="Enter origin"
      />
      <input 
        v-model="destination" 
        @input="findRoutes"
        placeholder="Enter destination"
      />
      
      <!-- Route results -->
      <div v-for="route in routes" :key="route.id">
        {{ route.summary }}
      </div>
    </div>
    
    <div id="map" ref="mapElement"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const origin = ref('');
const destination = ref('');
const routes = ref([]);
const mapElement = ref(null);
let map = null;
let googleMapsLoaded = false;

// Load Google Maps API
onMounted(async () => {
  // Fetch API key from backend
  const response = await fetch('/api/config/maps-key');
  const { apiKey } = await response.json();
  
  // Load Google Maps script
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
  script.async = true;
  script.onload = initMap;
  document.head.appendChild(script);
});

function initMap() {
  map = new google.maps.Map(mapElement.value, {
    center: { lat: 3.1390, lng: 101.6869 }, // Kuala Lumpur
    zoom: 12
  });
  googleMapsLoaded = true;
}

async function findRoutes() {
  if (!origin.value || !destination.value) return;
  
  // Call backend routing API
  const response = await fetch('/api/routing/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: origin.value,
      destination: destination.value
    })
  });
  
  const data = await response.json();
  routes.value = data.routes;
  
  // Draw routes on map
  drawRoutesOnMap(data.routes);
}

function drawRoutesOnMap(routes) {
  // Implementation similar to google-map-routing.html
  // See lines 1500-1800 in the original file
}
</script>
```

#### **React Example:**

```jsx
import React, { useEffect, useRef, useState } from 'react';

export default function MapRouting() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  async function loadGoogleMaps() {
    const response = await fetch('/api/config/maps-key');
    const { apiKey } = await response.json();

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }

  function initMap() {
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: { lat: 3.1390, lng: 101.6869 },
      zoom: 12
    });
  }

  async function findRoutes() {
    if (!origin || !destination) return;

    const response = await fetch('/api/routing/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination })
    });

    const data = await response.json();
    setRoutes(data.routes);
    drawRoutesOnMap(data.routes);
  }

  return (
    <div className="map-routing-container">
      <div className="sidebar">
        <input 
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Enter origin"
        />
        <input 
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination"
        />
        <button onClick={findRoutes}>Find Routes</button>
        
        {routes.map(route => (
          <div key={route.id}>{route.summary}</div>
        ))}
      </div>
      
      <div ref={mapRef} style={{ width: '100%', height: '600px' }}></div>
    </div>
  );
}
```

---

### **Option 3: Standalone Page** (Current Implementation)

Use as-is by navigating to:

```
http://localhost:3001/google-map-routing.html
```

Or deploy and link from your frontend:

```html
<a href="https://your-backend.com/google-map-routing.html" target="_blank">
  Open Route Planner
</a>
```

---

## 🔌 API Integration Details

### 1. Get Private Vehicle Routes

```javascript
const response = await fetch('/api/routing/compare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: "KLCC, Kuala Lumpur",
    destination: "Batu Caves, Selangor"
  })
});

const data = await response.json();
```

**Response Format:**
```json
{
  "routes": [
    {
      "mode": "drive",
      "distance": 15.2,
      "duration": 25,
      "emissions": 3.45,
      "coordinates": [[3.1579, 101.7120], ...],
      "instructions": ["Head north on Jalan Ampang", ...]
    },
    {
      "mode": "walk",
      "distance": 13.5,
      "duration": 180,
      "emissions": 0,
      "coordinates": [[3.1579, 101.7120], ...],
      "instructions": ["Walk north", ...]
    }
  ]
}
```

---

### 2. Get Public Transit Routes

```javascript
const response = await fetch('/api/routing/transit/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originLat: 3.1390,
    originLon: 101.6869,
    destLat: 3.2379,
    destLon: 101.6962
  })
});

const data = await response.json();
```

**Response Format:**
```json
{
  "routes": [
    {
      "segments": [
        {
          "type": "walk",
          "distance": 0.5,
          "duration": 6,
          "fromStop": null,
          "toStop": "KJ10 - KLCC"
        },
        {
          "type": "transit",
          "distance": 12.3,
          "duration": 18,
          "fromStop": "KJ10 - KLCC",
          "toStop": "KJ37 - BATU CAVES",
          "routeId": "5",
          "routeName": "KELANA JAYA LINE",
          "category": "rapid-rail-kl",
          "coordinates": [[3.1579, 101.7120], ...]
        }
      ],
      "totalDistance": 12.8,
      "totalDuration": 24,
      "totalEmissions": 0.85,
      "hasRealtime": true
    }
  ]
}
```

---

### 3. Get Live Vehicle Positions

```javascript
const response = await fetch(
  '/api/routing/realtime/vehicles-for-route?routes=U6000,U7800'
);

const data = await response.json();
```

**Response Format:**
```json
{
  "vehicles": [
    {
      "vehicleId": "BUS-123",
      "tripId": "T001",
      "routeId": "U6000",
      "category": "rapid-bus-kl",
      "latitude": 3.1390,
      "longitude": 101.6869,
      "bearing": 45.0,
      "speed": 35.5,
      "timestamp": "2025-10-12T10:30:00Z",
      "currentStatus": "IN_TRANSIT_TO"
    }
  ]
}
```

---

## 🎯 Features Included

### ✅ Core Features:

1. **Multi-Modal Routing**
   - 🚗 Private vehicle (drive)
   - 🚇 Public transit (MRT/LRT/Bus/KTMB)
   - 🚶 Walking
   - 🚴 Cycling

2. **Real-Time Tracking**
   - 📍 Live bus positions
   - 🚂 KTMB train tracking
   - ⏱️ 2-minute refresh intervals

3. **Smart Sorting**
   - ⏱️ Fastest route
   - 🌱 Lowest emissions
   - 📏 Shortest distance
   - ⭐ Most convenient (fewest transfers)
   - ⚖️ Best balance (weighted score)

4. **GPS Integration**
   - 📱 Use current location as origin
   - 🗺️ Location permission handling
   - 🔄 Real-time position updates

5. **Caching & Optimization**
   - 💾 2-minute browser cache
   - 🚀 Route result caching
   - 📊 Popular routes pre-cached
   - ⚡ Serverless-optimized

---

## 🔧 Configuration Options

### Customizing the Map:

#### **Change Default Location:**
```javascript
// In initMap() function (line ~650)
map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 3.1390, lng: 101.6869 }, // Change these coordinates
  zoom: 12, // Change zoom level
  styles: [] // Add custom map styling
});
```

#### **Adjust Cache Duration:**
```javascript
// In realtimeDataCache object (line ~2170)
const CACHE_DURATION = 120000; // 2 minutes (in milliseconds)
```

#### **Change Refresh Interval:**
```javascript
// In startBackgroundRefresh() function (line ~2490)
const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes
```

#### **Customize Route Colors:**
```javascript
// In drawRouteOnMap() function (line ~1500)
const routeColors = {
  drive: '#3b82f6',    // Blue
  transit: '#10b981',  // Green
  walk: '#f59e0b',     // Orange
  bike: '#8b5cf6'      // Purple
};
```

---

## 🚨 Common Issues & Solutions

### 1. **"Failed to load Google Maps API key"**

**Cause:** Backend server not running or `.env` missing `GOOGLE_MAPS_API_KEY`

**Solution:**
```bash
# Check if server is running
curl http://localhost:3001/api/config/maps-key

# Verify .env file
cat .env | grep GOOGLE_MAPS_API_KEY

# Restart server
npm start
```

---

### 2. **"No routes found"**

**Cause:** Database not populated with GTFS data

**Solution:**
```bash
# Import GTFS transit data
node scripts/importGTFS.js

# Verify data exists
node scripts/checkGTFSDataQuality.js
```

---

### 3. **"Live vehicles not showing"**

**Cause:** Real-time schema not set up

**Solution:**
```bash
# Setup real-time tracking tables
node scripts/setupRealtimeSchema.js

# Manually refresh data
node scripts/realtimeUpdater.js

# Check vehicle count
curl http://localhost:3001/api/gtfs/realtime/vehicles/rapid-bus-kl
```

---

### 4. **CORS errors from frontend**

**Cause:** Frontend domain not allowed

**Solution:**
```javascript
// In server.js
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // React dev server
    'https://your-frontend-domain.com'
  ],
  credentials: true
}));
```

---

### 5. **Slow routing performance**

**Cause:** No route caching or indexes

**Solution:**
```bash
# Setup route cache
node scripts/setupRouteCache.js

# Pre-cache popular routes
node scripts/cachePopularRoutes.js
node scripts/cachePopularTransitRoutes.js

# Add database indexes
psql $DATABASE_URL < db/optimize_gtfs_indexes.sql
```

---

## 📊 Performance Considerations

### API Call Optimization:

**Current Implementation:**
- 🔄 Background refresh: 2 minutes
- 🔄 Browser cache: 2 minutes
- 📊 ~30 API calls/hour per active user
- 💰 Well within free tier limits

**For High Traffic:**

1. **Increase cache duration:**
   ```javascript
   const CACHE_DURATION = 300000; // 5 minutes
   ```

2. **Pre-cache popular routes:**
   ```bash
   # Run daily via cron
   0 0 * * * cd /path/to/backend && node scripts/cachePopularRoutes.js
   ```

3. **Use CDN for static assets:**
   - Host `google-map-routing.html` on Vercel/Netlify
   - Serve from edge locations

4. **Enable Redis caching:**
   ```javascript
   // Add Redis for distributed caching
   import Redis from 'ioredis';
   const redis = new Redis(process.env.REDIS_URL);
   ```

---

## 🔗 Related Documentation

- [GTFS Realtime Documentation](./GTFS_REALTIME_DOCUMENTATION.md)
- [Routing Service Documentation](./ROUTING_SERVICE_DOCUMENTATION.md)
- [Transit Route Caching](./TRANSIT_ROUTE_CACHING.md)
- [Complete Setup Guide](./COMPLETE_SETUP_GUIDE.md)
- [Free Tier Optimization](../FREE_TIER_OPTIMIZATION.md)

---

## 📝 Quick Start Checklist

- [ ] Google Maps API key obtained and added to `.env`
- [ ] Database connected (`DATABASE_URL` in `.env`)
- [ ] GTFS data imported (`node scripts/importGTFS.js`)
- [ ] Real-time schema set up (`node scripts/setupRealtimeSchema.js`)
- [ ] Route cache initialized (`node scripts/setupRouteCache.js`)
- [ ] Backend server running (`npm start`)
- [ ] Test endpoint accessible: `http://localhost:3001/api/config/maps-key`
- [ ] Map loads successfully: `http://localhost:3001/google-map-routing.html`
- [ ] Routes can be searched (origin + destination)
- [ ] Live vehicle tracking works (click "Show Live Vehicles")

---

## 💡 Need Help?

**Test the APIs:**
```bash
# Test Google Maps key endpoint
curl http://localhost:3001/api/config/maps-key

# Test routing endpoint
curl -X POST http://localhost:3001/api/routing/compare \
  -H "Content-Type: application/json" \
  -d '{"origin":"KLCC","destination":"KL Sentral"}'

# Test transit planning
curl -X POST http://localhost:3001/api/routing/transit/plan \
  -H "Content-Type: application/json" \
  -d '{"originLat":3.1579,"originLon":101.7120,"destLat":3.1336,"destLon":101.6868}'

# Check live vehicles
curl http://localhost:3001/api/routing/realtime/vehicles-for-route?routes=U6000
```

**Check logs:**
```bash
# Server logs
npm start

# Real-time refresh logs
tail -f server.log | grep "vehicle positions"
```

---

## 🎉 You're Ready!

Your map integration is now complete. Users can:
- 🗺️ Search for routes between any locations
- 🚇 Compare public transit vs private vehicle options
- 📊 Sort by speed, emissions, distance, or convenience
- 📍 Track live buses and trains in real-time
- 📱 Use GPS for automatic origin detection

Happy coding! 🚀

