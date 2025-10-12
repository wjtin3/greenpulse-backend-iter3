# KTMB GTFS Integration Guide

## Overview

This guide explains how to integrate **KTMB (Keretapi Tanah Melayu Berhad)** train data into the GreenPulse routing system. KTMB operates Malaysia's commuter rail services including KTM Komuter lines.

## Data Source

- **Provider**: Malaysia Open Data Portal ([data.gov.my](https://data.gov.my))
- **API Endpoint**: `https://api.data.gov.my/gtfs-static/ktmb`
- **Format**: GTFS (General Transit Feed Specification)
- **Update Frequency**: Check data.gov.my for latest information
- **License**: Open Government Data License (Malaysia)

## KTMB Services Covered

The GTFS feed includes:

- 🚆 **KTM Komuter** - Suburban rail network
  - Port Klang Line
  - Seremban Line
  - Tanjung Malim Line
- 🚄 **ETS (Electric Train Service)** - Intercity express trains
- 🚂 Other KTMB rail services

## Integration Steps

### 1. Install Dependencies

```bash
npm install
```

This will install required packages:
- `csv-parser` - For parsing GTFS CSV files
- `unzipper` - For extracting GTFS ZIP archives

### 2. Import KTMB Data

Run the import script:

```bash
npm run import-ktmb
```

This will:
1. ✅ Download GTFS data from data.gov.my
2. ✅ Extract the ZIP archive
3. ✅ Create PostgreSQL schema (`gtfs_ktmb_schema.sql`)
4. ✅ Import all GTFS files into database
5. ✅ Create indexes for performance
6. ✅ Verify data integrity

### 3. Restart Server

```bash
npm run dev
```

The server will automatically include KTMB in routing queries.

## Database Schema

### Tables Created

All tables are in the `gtfs` schema with `_ktmb` suffix:

| Table | Description | Key Fields |
|-------|-------------|------------|
| `agency_ktmb` | KTMB agency info | `agency_id`, `agency_name` |
| `routes_ktmb` | Train routes/lines | `route_id`, `route_long_name`, `route_type` |
| `stops_ktmb` | Train stations | `stop_id`, `stop_name`, `stop_lat`, `stop_lon` |
| `trips_ktmb` | Train trips | `trip_id`, `route_id`, `shape_id` |
| `stop_times_ktmb` | Train schedules | `trip_id`, `stop_id`, `stop_sequence`, `shape_dist_traveled` |
| `calendar_ktmb` | Service calendar | `service_id`, weekday flags |
| `shapes_ktmb` | Route geometries | `shape_id`, `shape_pt_lat`, `shape_pt_lon`, `shape_pt_sequence` |
| `calendar_dates_ktmb` | Schedule exceptions | `service_id`, `date`, `exception_type` |
| `frequencies_ktmb` | Headway schedules | `trip_id`, `start_time`, `headway_secs` |
| `transfers_ktmb` | Station transfers | `from_stop_id`, `to_stop_id`, `min_transfer_time` |

### Spatial Indexing

The `stops_ktmb` table includes a PostGIS spatial index:

```sql
CREATE INDEX idx_stops_ktmb_location 
ON gtfs.stops_ktmb USING GIST (
    ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)
);
```

This enables fast proximity queries for nearby stations.

## How Routing Uses KTMB Data

### 1. Station Discovery

When a user searches for routes, the system:
- Finds nearby KTMB stations within walking distance
- Uses the spatial index for fast queries
- Includes KTMB alongside Rapid KL (MRT/LRT/Bus)

### 2. Route Calculation

For each KTMB route found:
- Queries `stop_times_ktmb` for schedules
- Uses `stop_sequence` for correct ordering
- Fetches `shape_dist_traveled` for accurate distance
- Retrieves route geometry from `shapes_ktmb`

### 3. Multi-Modal Transfers

KTMB integrates seamlessly with existing transit:
- 🚌→🚆 Bus to KTMB train
- 🚇→🚆 MRT/LRT to KTMB train
- 🚆→🚌 KTMB train to bus

## GTFS-Compliant Shape Matching

The system uses GTFS best practices:

```javascript
// Uses stop_sequence from stop_times_ktmb
SELECT 
    st_board.stop_sequence,
    st_alight.stop_sequence,
    st_board.shape_dist_traveled,
    st_alight.shape_dist_traveled
FROM gtfs.stop_times_ktmb

// Maps to shape points in shapes_ktmb
SELECT shape_pt_lat, shape_pt_lon, shape_dist_traveled
FROM gtfs.shapes_ktmb
WHERE shape_dist_traveled BETWEEN board_dist AND alight_dist
```

This ensures accurate route visualization on the map.

## Emission Calculations

KTMB trains have emission factors:
- **KTM Komuter**: ~41 g CO₂/passenger-km
- **ETS**: ~14 g CO₂/passenger-km (electric)

These are automatically applied in carbon footprint comparisons.

## Example Queries

### Find nearest KTMB station
```sql
SELECT stop_name, stop_lat, stop_lon,
       ST_Distance(
           ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)::geography,
           ST_SetSRID(ST_MakePoint(101.6869, 3.1390), 4326)::geography
       ) / 1000 as distance_km
FROM gtfs.stops_ktmb
ORDER BY distance_km
LIMIT 5;
```

### List all KTMB routes
```sql
SELECT route_id, route_short_name, route_long_name, route_type
FROM gtfs.routes_ktmb
ORDER BY route_short_name;
```

### Check data freshness
```sql
SELECT 
    feed_publisher_name,
    feed_version,
    feed_start_date,
    feed_end_date
FROM gtfs.feed_info_ktmb;
```

## Maintenance

### Update KTMB Data

To refresh with latest data:

```bash
npm run import-ktmb
```

This will:
- Download latest GTFS feed
- Replace existing KTMB data
- Preserve other transit data (Rapid KL)

### Clear KTMB Cache

After updating data, clear cached routes:

```sql
DELETE FROM route_cache WHERE mode = 'transit';
```

Or use the cache clearing script if you create one for KTMB specifically.

## Troubleshooting

### Import fails with "Download failed"
- Check internet connection
- Verify data.gov.my is accessible
- URL may have changed - check [data.gov.my](https://data.gov.my)

### No KTMB routes showing
- Verify data imported: `SELECT COUNT(*) FROM gtfs.stops_ktmb;`
- Check `transitRoutingService.js` includes `'ktmb'` in categories
- Restart server after import

### Routes showing incorrect path
- KTMB feed may lack `shapes.txt` or `shape_dist_traveled`
- System will fall back to straight lines
- Check shape data: `SELECT COUNT(*) FROM gtfs.shapes_ktmb;`

## Performance Considerations

### Indexes
All critical indexes are created automatically:
- Station locations (spatial)
- Route lookups
- Trip schedules
- Shape geometries

### Cache Strategy
KTMB routes are cached like other transit:
- First query: Calculate and cache
- Subsequent: Use cached result
- Cache includes full geometry

### Query Optimization
- Spatial queries use PostGIS GIST index
- Stop times indexed by `trip_id` and `stop_id`
- Shape lookups optimized by `shape_id`

## References

- [GTFS Specification](https://gtfs.org/schedule/)
- [Malaysia Open Data Portal](https://data.gov.my)
- [KTMB Official Website](https://www.ktmb.com.my)
- [PostGIS Documentation](https://postgis.net/docs/)

## Support

For issues related to:
- **GTFS feed**: Contact data.gov.my
- **KTMB operations**: Contact KTMB
- **Integration**: Check this guide or system logs

---

**Last Updated**: October 2025  
**Data Source**: data.gov.my GTFS Static Feed  
**System Version**: GreenPulse Backend v1.0

