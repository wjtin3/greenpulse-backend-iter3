# GTFS Realtime Vehicle Position API Documentation

## Overview

This API provides real-time vehicle position data for Prasarana public transport services in Kuala Lumpur, Malaysia. The data is fetched from the official Malaysian Government API and stored in your database for quick access.

## Features

- ✅ Real-time vehicle position tracking
- ✅ Automatic data refresh with old data cleanup
- ✅ Support for multiple transport categories
- ✅ Location-based queries (find vehicles near a location)
- ✅ Historical data retention (configurable)
- ✅ Protocol Buffer (protobuf) parsing
- ✅ Optimized for Vercel serverless deployment

## Available Categories

1. **rapid-bus-kl** - KL bus services operated by Prasarana
2. **rapid-bus-mrtfeeder** - Buses that bring passengers to MRT stations

## Setup

### 1. Install Dependencies

The required package is already installed:
```bash
npm install gtfs-realtime-bindings
```

### 2. Setup Database Schema

Run the setup script to create the necessary database tables and functions:

```bash
node scripts/setupGTFSRealtime.js
```

This will create:
- `gtfs.vehicle_positions_rapid_bus_kl` table
- `gtfs.vehicle_positions_rapid_bus_mrtfeeder` table
- Helper functions for querying and cleanup
- A view for all current vehicle positions

### 3. Test the Setup

After setup, test the health endpoint:
```bash
GET https://your-domain.com/api/gtfs/realtime/health
```

## API Endpoints

### Health Check

**GET** `/api/gtfs/realtime/health`

Check the health status of the GTFS Realtime service.

**Response:**
```json
{
  "success": true,
  "data": {
    "service": "GTFS Realtime Vehicle Positions",
    "status": "healthy",
    "baseUrl": "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana",
    "availableCategories": ["rapid-bus-kl", "rapid-bus-mrtfeeder"],
    "categoryStatus": {
      "rapid-bus-kl": {
        "recentVehicles": 45,
        "latestUpdate": "2024-10-09T10:30:00Z"
      },
      "rapid-bus-mrtfeeder": {
        "recentVehicles": 23,
        "latestUpdate": "2024-10-09T10:30:00Z"
      }
    }
  }
}
```

---

### Get Available Categories

**GET** `/api/gtfs/realtime/categories`

Get list of available realtime categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": ["rapid-bus-kl", "rapid-bus-mrtfeeder"],
    "total": 2,
    "description": "Available categories for GTFS Realtime vehicle positions"
  }
}
```

---

### Refresh Vehicle Positions (Single Category)

**POST** `/api/gtfs/realtime/refresh/:category`

Fetch latest vehicle positions from the Prasarana API and update the database.

**Parameters:**
- `category` (path) - Category to refresh: `rapid-bus-kl` or `rapid-bus-mrtfeeder`

**Body (optional):**
```json
{
  "clearOld": true
}
```

**Example:**
```bash
POST https://your-domain.com/api/gtfs/realtime/refresh/rapid-bus-kl
```

**Response:**
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
  "message": "Successfully refreshed vehicle positions for rapid-bus-kl"
}
```

---

### Refresh Vehicle Positions (Multiple Categories)

**POST** `/api/gtfs/realtime/refresh`

Refresh multiple categories at once.

**Body:**
```json
{
  "categories": ["rapid-bus-kl", "rapid-bus-mrtfeeder"],
  "clearOld": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "success": true,
        "category": "rapid-bus-kl",
        "fetch": { "count": 45 },
        "store": { "deletedCount": 42, "insertedCount": 45, "skippedCount": 0 }
      },
      {
        "success": true,
        "category": "rapid-bus-mrtfeeder",
        "fetch": { "count": 23 },
        "store": { "deletedCount": 20, "insertedCount": 23, "skippedCount": 0 }
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  }
}
```

---

### Refresh All Categories

**POST** `/api/gtfs/realtime/refresh/all`

Refresh all available categories.

**Body (optional):**
```json
{
  "clearOld": true
}
```

---

### Get Latest Vehicle Positions

**GET** `/api/gtfs/realtime/vehicles/:category`

Get the latest vehicle positions for a category from the database.

**Parameters:**
- `category` (path) - Category: `rapid-bus-kl` or `rapid-bus-mrtfeeder`
- `minutesOld` (query, optional) - Maximum age of data in minutes (default: 10)

**Example:**
```bash
GET https://your-domain.com/api/gtfs/realtime/vehicles/rapid-bus-kl?minutesOld=5
```

**Response:**
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
    "count": 45,
    "minutesOld": 5
  }
}
```

---

### Get All Current Vehicle Positions

**GET** `/api/gtfs/realtime/vehicles`

Get all current vehicle positions across all categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicles": [...],
    "byCategory": {
      "rapid-bus-kl": [...],
      "rapid-bus-mrtfeeder": [...]
    },
    "totalCount": 68
  }
}
```

---

### Get Nearby Vehicles

**GET** `/api/gtfs/realtime/vehicles/nearby/:category`

Find vehicles near a specific location.

**Parameters:**
- `category` (path) - Category: `rapid-bus-kl` or `rapid-bus-mrtfeeder`
- `lat` (query, required) - Latitude
- `lon` (query, required) - Longitude
- `radius` (query, required) - Search radius in kilometers
- `minutesOld` (query, optional) - Maximum age of data (default: 10)

**Example:**
```bash
GET https://your-domain.com/api/gtfs/realtime/vehicles/nearby/rapid-bus-kl?lat=3.1390&lon=101.6869&radius=2
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "rapid-bus-kl",
    "location": {
      "latitude": 3.1390,
      "longitude": 101.6869
    },
    "radiusKm": 2,
    "vehicles": [
      {
        "vehicle_id": "BUS-001",
        "trip_id": "TRIP-123",
        "route_id": "ROUTE-1",
        "latitude": 3.1395,
        "longitude": 101.6875,
        "bearing": 180.5,
        "speed": 35.2,
        "distance_km": 0.08,
        "timestamp": "1696852800"
      }
    ],
    "count": 3
  }
}
```

---

### Cleanup Old Records

**DELETE** `/api/gtfs/realtime/cleanup/:category`

Remove old vehicle position records to save space.

**Parameters:**
- `category` (path) - Category to cleanup
- `hoursToKeep` (query, optional) - Hours of data to keep (default: 24)

**Example:**
```bash
DELETE https://your-domain.com/api/gtfs/realtime/cleanup/rapid-bus-kl?hoursToKeep=24
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "rapid-bus-kl",
    "deletedCount": 1234,
    "hoursKept": 24
  },
  "message": "Cleaned up 1234 old records for rapid-bus-kl"
}
```

---

## Database Schema

### Vehicle Position Table Structure

Each category has its own table (e.g., `gtfs.vehicle_positions_rapid_bus_kl`):

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| vehicle_id | VARCHAR(100) | Vehicle identifier |
| trip_id | VARCHAR(100) | Current trip ID |
| route_id | VARCHAR(100) | Route ID |
| latitude | DOUBLE PRECISION | Vehicle latitude |
| longitude | DOUBLE PRECISION | Vehicle longitude |
| bearing | REAL | Vehicle bearing/heading |
| speed | REAL | Vehicle speed |
| timestamp | BIGINT | Position timestamp |
| vehicle_label | VARCHAR(100) | Display label |
| current_status | VARCHAR(50) | Vehicle status |
| occupancy_status | VARCHAR(50) | Occupancy level |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Database Functions

The schema includes several helper functions:

1. **gtfs.create_realtime_vehicle_positions_table(category_name)**
   - Creates vehicle position table for a category

2. **gtfs.cleanup_old_vehicle_positions(category_name, hours_to_keep)**
   - Deletes old records

3. **gtfs.get_latest_vehicle_positions(category_name, minutes_old)**
   - Gets latest positions

4. **gtfs.get_vehicle_positions_within_radius(lat, lon, radius_km, category_name, minutes_old)**
   - Finds vehicles near a location

5. **gtfs.get_vehicle_history(vehicle_id, category_name, hours_back)**
   - Gets position history for a vehicle

---

## Usage Examples

### Frontend Integration

```javascript
// Fetch and refresh all vehicle positions
async function refreshVehicles() {
  const response = await fetch('/api/gtfs/realtime/refresh/all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clearOld: true })
  });
  const data = await response.json();
  console.log(`Refreshed ${data.data.summary.successful} categories`);
}

// Get nearby buses
async function getNearbyBuses(lat, lon) {
  const response = await fetch(
    `/api/gtfs/realtime/vehicles/nearby/rapid-bus-kl?lat=${lat}&lon=${lon}&radius=2`
  );
  const data = await response.json();
  return data.data.vehicles;
}

// Display vehicles on a map
async function showVehiclesOnMap() {
  const response = await fetch('/api/gtfs/realtime/vehicles');
  const data = await response.json();
  
  data.data.vehicles.forEach(vehicle => {
    // Add marker to map at vehicle.latitude, vehicle.longitude
    addMarkerToMap(vehicle.latitude, vehicle.longitude, {
      label: vehicle.vehicle_label,
      route: vehicle.route_id,
      status: vehicle.current_status
    });
  });
}
```

### Automated Refresh (Scheduled Job)

For automatic updates, you can set up a cron job or use Vercel Cron:

**Option 1: Vercel Cron**
Add to `vercel.json`:
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

**Option 2: External Cron Service**
Use a service like cron-job.org to call your API every 5 minutes:
```
POST https://your-domain.com/api/gtfs/realtime/refresh/all
```

---

## Performance Considerations

1. **Data Freshness**: Vehicle positions are typically updated every 30-60 seconds by Prasarana
2. **Refresh Frequency**: Recommended to refresh every 1-5 minutes
3. **Database Cleanup**: Run cleanup daily or weekly to maintain performance
4. **Vercel Limits**: Be mindful of serverless function execution time (10s default, 60s max)

---

## Troubleshooting

### No vehicles returned

1. Check if data has been fetched:
   ```bash
   GET /api/gtfs/realtime/health
   ```

2. Refresh the data:
   ```bash
   POST /api/gtfs/realtime/refresh/all
   ```

### Database connection errors

Ensure your `DATABASE_URL` environment variable is set correctly in Vercel.

### API fetch errors

The Prasarana API may occasionally be unavailable. Implement retry logic in production.

---

## Data Source

Data is provided by:
- **Source**: Malaysia Government Open Data Portal
- **API**: https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana
- **Format**: GTFS Realtime (Protocol Buffers)
- **Update Frequency**: Real-time (updated continuously)

---

## License & Attribution

When using this data, please attribute:
- Data source: Malaysia Government Open Data Portal (data.gov.my)
- Transport operator: Prasarana Malaysia Berhad

---

## Support

For issues or questions:
1. Check the health endpoint: `/api/gtfs/realtime/health`
2. Review server logs in Vercel dashboard
3. Verify database schema is properly set up
4. Test with Postman or similar tools

---

## Next Steps

1. **Setup the database schema**: Run `node scripts/setupGTFSRealtime.js`
2. **Test the endpoints**: Use Postman or your frontend
3. **Setup automated refresh**: Configure Vercel Cron or external service
4. **Integrate with frontend**: Display vehicles on a map
5. **Monitor performance**: Check logs and optimize as needed

