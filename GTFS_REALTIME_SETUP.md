# GTFS Realtime Vehicle Position Setup Guide

## Quick Start

This backend now supports real-time vehicle position tracking for Prasarana public transport (KL buses and MRT feeder buses).

### 1. Prerequisites

- Node.js installed
- PostgreSQL database configured
- `DATABASE_URL` environment variable set

### 2. Setup Steps

#### Step 1: Install Dependencies (Already Done)
```bash
npm install
```

The `gtfs-realtime-bindings` package has been installed for Protocol Buffer parsing.

#### Step 2: Setup Database Schema
```bash
npm run setup-gtfs-realtime
```

This creates:
- Vehicle position tables for each category
- Helper functions for queries and cleanup
- Indexes for performance
- A view for all current vehicles

#### Step 3: Test the API (Optional but Recommended)

Start your server:
```bash
npm run dev
```

In another terminal, run the test suite:
```bash
npm run test-gtfs-realtime
```

Or test manually with curl:
```bash
# Check health
curl http://localhost:3001/api/gtfs/realtime/health

# Refresh all vehicles
curl -X POST http://localhost:3001/api/gtfs/realtime/refresh/all \
  -H "Content-Type: application/json"

# Get all vehicles
curl http://localhost:3001/api/gtfs/realtime/vehicles
```

### 3. Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gtfs/realtime/health` | Service health check |
| GET | `/api/gtfs/realtime/categories` | Available categories |
| POST | `/api/gtfs/realtime/refresh/:category` | Refresh single category |
| POST | `/api/gtfs/realtime/refresh` | Refresh multiple categories |
| POST | `/api/gtfs/realtime/refresh/all` | Refresh all categories |
| GET | `/api/gtfs/realtime/vehicles/:category` | Get vehicles by category |
| GET | `/api/gtfs/realtime/vehicles` | Get all vehicles |
| GET | `/api/gtfs/realtime/vehicles/nearby/:category` | Get nearby vehicles |
| DELETE | `/api/gtfs/realtime/cleanup/:category` | Cleanup old records |

### 4. Setup Automated Refresh (Recommended)

#### Option A: Vercel Cron (Recommended for Vercel deployments)

Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/gtfs/realtime/refresh/all",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This refreshes data every 5 minutes.

#### Option B: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Create a new cron job
2. Set URL: `https://your-domain.vercel.app/api/gtfs/realtime/refresh/all`
3. Set method: POST
4. Set interval: Every 5 minutes
5. Add header: `Content-Type: application/json`

#### Option C: GitHub Actions (For scheduled updates)

Create `.github/workflows/refresh-vehicles.yml`:
```yaml
name: Refresh Vehicle Positions

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X POST https://your-domain.vercel.app/api/gtfs/realtime/refresh/all \
            -H "Content-Type: application/json"
```

### 5. Database Maintenance

#### Cleanup Old Data

To keep your database lean, periodically clean up old records:

```bash
# Keep last 24 hours only
curl -X DELETE "http://localhost:3001/api/gtfs/realtime/cleanup/rapid-bus-kl?hoursToKeep=24"
```

You can also automate this with a weekly cron job.

### 6. Frontend Integration

#### Example: Display vehicles on a map

```javascript
// Fetch and display all current vehicles
async function loadVehicles() {
  const response = await fetch('/api/gtfs/realtime/vehicles');
  const data = await response.json();
  
  if (data.success) {
    data.data.vehicles.forEach(vehicle => {
      // Add marker to your map
      L.marker([vehicle.latitude, vehicle.longitude])
        .bindPopup(`
          <b>${vehicle.vehicle_label || vehicle.vehicle_id}</b><br>
          Route: ${vehicle.route_id}<br>
          Speed: ${vehicle.speed || 'N/A'} km/h<br>
          Status: ${vehicle.current_status || 'Unknown'}
        `)
        .addTo(map);
    });
  }
}

// Refresh data every minute
setInterval(loadVehicles, 60000);
```

#### Example: Find nearby buses

```javascript
async function findNearbyBuses(userLat, userLon, radiusKm = 2) {
  const url = `/api/gtfs/realtime/vehicles/nearby/rapid-bus-kl?lat=${userLat}&lon=${userLon}&radius=${radiusKm}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.success) {
    return data.data.vehicles.map(v => ({
      id: v.vehicle_id,
      distance: v.distance_km,
      route: v.route_id,
      location: [v.latitude, v.longitude]
    }));
  }
  return [];
}
```

### 7. Monitoring

Check service health:
```javascript
async function checkHealth() {
  const response = await fetch('/api/gtfs/realtime/health');
  const data = await response.json();
  
  console.log('Service Status:', data.data.status);
  console.log('Recent Vehicles:', data.data.categoryStatus);
}
```

### 8. Production Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add GTFS Realtime vehicle tracking"
   git push
   ```

2. **Deploy to Vercel**
   - Vercel will automatically deploy
   - Or manually: `vercel --prod`

3. **Setup Database Schema on Production**
   
   After deployment, run the setup script once:
   ```bash
   # SSH into your server or use Vercel CLI
   vercel exec -- node scripts/setupGTFSRealtime.js
   ```

   Or manually run the SQL schema file on your production database.

4. **Configure Environment Variables**
   
   In Vercel Dashboard, ensure `DATABASE_URL` is set.

5. **Test Production Deployment**
   ```bash
   curl https://your-domain.vercel.app/api/gtfs/realtime/health
   ```

6. **Setup Cron Job** (see step 4 above)

### 9. Troubleshooting

#### Problem: No vehicles returned

**Solution:**
1. Run refresh endpoint first:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/gtfs/realtime/refresh/all
   ```
2. Check health endpoint for errors
3. Verify database schema is created

#### Problem: Database connection errors

**Solution:**
- Verify `DATABASE_URL` environment variable
- Check database is accessible from Vercel
- Ensure database schema is created

#### Problem: API timeout on Vercel

**Solution:**
- Vercel free tier has 10s timeout
- Pro tier has 60s timeout
- Refresh one category at a time if needed
- Or use background job service

### 10. API Response Examples

#### Successful Refresh:
```json
{
  "success": true,
  "data": {
    "category": "rapid-bus-kl",
    "fetch": {
      "count": 45,
      "feedTimestamp": "1696852800"
    },
    "store": {
      "deletedCount": 42,
      "insertedCount": 45,
      "skippedCount": 0
    }
  },
  "timestamp": "2024-10-09T10:30:00Z"
}
```

#### Vehicle Positions:
```json
{
  "success": true,
  "data": {
    "category": "rapid-bus-kl",
    "vehicles": [
      {
        "vehicle_id": "BUS-001",
        "trip_id": "TRIP-123",
        "route_id": "ROUTE-1",
        "latitude": 3.1390,
        "longitude": 101.6869,
        "bearing": 180.5,
        "speed": 35.2,
        "timestamp": "1696852800",
        "vehicle_label": "Bus 001",
        "current_status": "IN_TRANSIT_TO",
        "occupancy_status": "FEW_SEATS_AVAILABLE"
      }
    ],
    "count": 45
  }
}
```

## Documentation

Full API documentation is available in:
- `guides/GTFS_REALTIME_DOCUMENTATION.md` - Complete API reference
- `test/test-gtfs-realtime.js` - Usage examples

## Support & Data Source

- **Data Source**: Malaysia Government Open Data Portal (data.gov.my)
- **API**: https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana
- **Format**: GTFS Realtime (Protocol Buffers)
- **Categories**: `rapid-bus-kl`, `rapid-bus-mrtfeeder`

## Next Steps

1. ✅ Run `npm run setup-gtfs-realtime` to create database schema
2. ✅ Test with `npm run test-gtfs-realtime`
3. ✅ Setup automated refresh (Vercel Cron or external service)
4. ✅ Integrate with your frontend
5. ✅ Monitor and optimize as needed

Enjoy tracking real-time vehicle positions! 🚌🚇

