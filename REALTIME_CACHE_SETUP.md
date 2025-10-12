# Real-Time Vehicle Tracking - Cache Setup

## Overview
Real-time vehicle data is now automatically fetched and cached on server startup, eliminating the need for repeated API calls during route searches.

---

## How It Works

### 🚀 **Server Startup (Automatic)**
When the server starts, it automatically:
1. Fetches initial vehicle positions for all categories:
   - `rapid-bus-kl` (Prasarana buses)
   - `rapid-bus-mrtfeeder` (MRT feeder buses)
   - `ktmb` (KTM trains)

2. Stores data in PostgreSQL database tables:
   - `gtfs.vehicle_positions_rapid_bus_kl`
   - `gtfs.vehicle_positions_rapid_bus_mrtfeeder`
   - `gtfs.vehicle_positions_ktmb`

3. Sets up automatic refresh every **2 minutes**

---

## Cache Duration

### **Backend (Database Cache)**
- **Duration**: 2 minutes (120 seconds)
- **Behavior**: 
  - If data is less than 2 minutes old → Use cached data
  - If data is older than 2 minutes → Fetch fresh data from data.gov.my
- **Location**: PostgreSQL `vehicle_positions_*` tables

### **Frontend (Browser Cache)**
- **Duration**: 2 minutes (120 seconds)
- **Behavior**:
  - If user clicks "Show Live Vehicles" within 2 minutes → Use browser cache
  - No redundant API calls to backend
- **Location**: Browser `sessionStorage`

---

## User Experience

### **First Route Search (Within 2 Minutes of Server Start)**
```
User searches route → Backend uses fresh cached data → Instant response ✅
```

### **Subsequent Searches (Within 2 Minutes)**
```
User searches another route → Backend still has fresh data → Instant response ✅
User clicks "Show Live Vehicles" → Frontend uses browser cache → No API call ✅
```

### **After 2 Minutes**
```
User searches route → Backend refreshes data automatically → Stores new cache → Returns fresh data ✅
```

---

## Technical Details

### **Server Initialization Code** (`server.js`)
```javascript
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Initialize real-time vehicle tracking
    const gtfsRealtimeService = new GTFSRealtimeService();
    await gtfsRealtimeService.initializeRealtimeData();  // Fetch initial data
    gtfsRealtimeService.startPeriodicRefresh();          // Start 2-minute refresh
});
```

### **On-Demand Refresh Logic** (`gtfsRealtimeService.js`)
```javascript
// Check if data is stale
const needsRefresh = !latestTimestamp || 
    (Date.now() - new Date(latestTimestamp).getTime()) > 120000; // 2 minutes

if (needsRefresh) {
    console.log(`♻️ Refreshing stale data for ${category} (on-demand)`);
    await this.refreshVehiclePositions(category);
} else {
    console.log(`✓ Using fresh cached data for ${category}`);
}
```

### **Frontend Cache** (`google-map-routing.html`)
```javascript
// Check browser cache
if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    // Use cache if less than 2 minutes old
    if (Date.now() - timestamp < 120000) {
        console.log(`📦 Using cached vehicle data (${seconds}s old)`);
        displayVehicleMarkers(data);
        return;
    }
}
```

---

## Performance Benefits

### **Before (On-Demand Only)**
- ❌ First route search: Fetches protobuf data → Timeout errors
- ❌ Each search: 3-10 second wait for API response
- ❌ Database timeout issues with 163+ vehicles

### **After (Preload + Cache)**
- ✅ Server startup: Fetches all data once
- ✅ First route search: Instant (data already in database)
- ✅ Subsequent searches: Instant (within 2 minutes)
- ✅ No timeout errors (batch inserts with 60s timeout)
- ✅ Automatic refresh every 2 minutes (background)

---

## Monitoring

### **Server Logs**
```
🚀 Initializing real-time vehicle tracking...
  📡 Fetching initial data for rapid-bus-kl
Successfully fetched 163 vehicle positions for rapid-bus-kl
  Progress: 50/163 vehicles processed
  Progress: 100/163 vehicles processed
  Progress: 150/163 vehicles processed
Stored 163 vehicle positions for rapid-bus-kl
  📡 Fetching initial data for rapid-bus-mrtfeeder
Stored 87 vehicle positions for rapid-bus-mrtfeeder
  📡 Fetching initial data for ktmb
Stored 24 vehicle positions for ktmb
✅ Real-time vehicle tracking initialized
🔄 Starting periodic real-time data refresh (every 2 minutes)
```

### **Route Search Logs**
```
🚌 Fetching realtime vehicles for 1 routes
✓ Using fresh cached data for rapid-bus-kl (45s old)
Found 3 vehicles for route U6418 in rapid-bus-kl
```

### **Periodic Refresh Logs** (Every 2 minutes)
```
⏰ Periodic refresh triggered
=== Refreshing vehicle positions for rapid-bus-kl ===
Successfully fetched 158 vehicle positions for rapid-bus-kl
Stored 158 vehicle positions for rapid-bus-kl
```

---

## Configuration

### **Adjust Cache Duration**
To change the 2-minute cache, update both backend and frontend:

**Backend** (`services/gtfsRealtimeService.js`):
```javascript
const needsRefresh = (Date.now() - timestamp) > 180000; // 3 minutes
const REFRESH_INTERVAL = 180000; // 3 minutes
```

**Frontend** (`public/google-map-routing.html`):
```javascript
if (Date.now() - timestamp < 180000) { // 3 minutes
```

### **Disable Auto-Initialization** (Not Recommended)
Remove these lines from `server.js`:
```javascript
const gtfsRealtimeService = new GTFSRealtimeService();
await gtfsRealtimeService.initializeRealtimeData();
gtfsRealtimeService.startPeriodicRefresh();
```

---

## Troubleshooting

### **Issue: "timeout exceeded when trying to connect"**
**Solution**: This was fixed with:
- Statement timeout increased to 60 seconds
- Batch processing (50 vehicles at a time)
- Progress logging for debugging

### **Issue: "Found 0 vehicles"**
**Solution**: 
- Check if vehicle's `routeId` matches the searched route
- Verify filters (`directionId`, `stopSequence`) are correct
- Confirm data was successfully stored in database

### **Issue: Data not refreshing**
**Solution**:
- Check server logs for "⏰ Periodic refresh triggered"
- Verify database connection is active
- Check `data.gov.my` API status

---

## API Endpoints

### **Get Vehicles for Route**
```
GET /api/routing/realtime/vehicles-for-route?routes=[{category, routeId, options}]
```

**Response** (if cached):
```json
{
  "success": true,
  "vehicles": [...],
  "cached": true,
  "cacheAge": "45s"
}
```

### **Health Check**
```
GET /api/routing/realtime/health
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Server Startup                                              │
│  ├─ Initialize GTFSRealtimeService                          │
│  ├─ Fetch from data.gov.my (rapid-bus-kl, mrtfeeder, ktmb) │
│  └─ Store in PostgreSQL (vehicle_positions_*)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Background Refresh (Every 2 Minutes)                        │
│  ├─ Fetch fresh protobuf data                               │
│  ├─ Parse with gtfs-realtime-bindings                       │
│  └─ Update database (INSERT ... ON CONFLICT UPDATE)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  User Searches Route                                         │
│  ├─ Frontend: /api/routing/transit/plan                     │
│  ├─ Backend: Check database cache age                       │
│  ├─ If < 2min old: Use cached data ✅                       │
│  └─ If > 2min old: Refresh + cache ♻️                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  User Clicks "Show Live Vehicles"                            │
│  ├─ Frontend: Check sessionStorage                           │
│  ├─ If cached: Use browser cache ✅                          │
│  └─ If not: Fetch from backend                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

✅ **Real-time data is preloaded on server startup**  
✅ **Cached for 2 minutes in database and browser**  
✅ **Automatic background refresh every 2 minutes**  
✅ **No API calls needed during route searches**  
✅ **Instant response for users within 2-minute window**  
✅ **Timeout issues resolved with batch inserts**  

The system now provides instant real-time vehicle tracking while minimizing API calls and database load! 🎯

