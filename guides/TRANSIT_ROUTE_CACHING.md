# Transit Route Caching Guide

## Overview

This guide explains how to pre-cache popular transit routes in the Klang Valley to significantly improve routing performance.

## Why Pre-cache Transit Routes?

Transit route calculation involves:
- Querying GTFS database for stops, routes, and schedules
- Calculating walking distances
- Finding optimal transfers
- Fetching route geometry from shapes data

**Without caching**: 5-15 seconds per route  
**With caching**: 10-50ms per route (100-1000x faster!)

## Pre-cached Routes

The system includes **65+ popular transit routes** covering:

### Major Areas:
- ✅ Petaling Jaya (Subang Jaya, Kelana Jaya, Sea Park, Sunway)
- ✅ Puchong (IOI Mall, Bandar Puteri, Puchong Jaya)
- ✅ Kuala Lumpur (KLCC, KL Sentral, Bukit Bintang, Bangsar)
- ✅ Cheras (Cheras Leisure Mall, Taman Connaught)
- ✅ Damansara (Damansara Utama, The Curve, TTDI)
- ✅ Kepong & Sentul
- ✅ Setapak & Gombak
- ✅ Ampang & Setiawangsa
- ✅ Shah Alam & Klang
- ✅ Cyberjaya & Putrajaya

### Key Destinations:
- 🏢 Business Districts: KLCC, Bangsar South
- 🛍️ Shopping Malls: Mid Valley, Sunway Pyramid, IOI Mall
- 🚉 Transit Hubs: KL Sentral, Pasar Seni
- 🎓 Universities: UM, Monash, Taylor's, Sunway University
- 🏙️ City Centers: Bukit Bintang, Bangsar

## How to Pre-cache Routes

### Option 1: Run the Caching Script

```bash
npm run cache-transit-routes
```

This will:
1. Load all 65+ popular routes from `config/popularTransitRoutes.js`
2. Calculate each transit route
3. Automatically cache results in the database
4. Show progress and statistics

### Option 2: Automatic Caching (Built-in)

Routes are automatically cached when:
- A user requests a route for the first time
- The route is stored in `route_cache` table
- Subsequent requests use the cached data

## Cache Statistics

After caching, you'll see statistics like:

```
📊 PRE-CACHING SUMMARY
═══════════════════════════════════════════════════════════════
✅ Successfully cached: 52 routes
⚠️  Skipped (no routes): 13 routes
❌ Errors: 0 routes
⏱️  Total time: 180.45s
⚡ Average time per route: 2.78s
═══════════════════════════════════════════════════════════════

💾 CACHE STATISTICS:
───────────────────────────────────────────────────────────────
car        : 15 cached routes
transit    : 52 cached routes
bike       : 12 cached routes
foot       : 15 cached routes
───────────────────────────────────────────────────────────────
```

## Adding New Routes

Edit `config/popularTransitRoutes.js`:

```javascript
{
    name: 'My Area to KLCC',
    origin: { lat: 3.1234, lon: 101.5678, name: 'My Area' },
    destination: { lat: 3.1572757, lon: 101.7122335, name: 'KLCC' }
}
```

Then run:
```bash
npm run cache-transit-routes
```

## Cache Management

### View Cache Contents

```sql
SELECT mode, COUNT(*) as count
FROM route_cache
GROUP BY mode;
```

### Clear Transit Cache

```sql
DELETE FROM route_cache WHERE mode = 'transit';
```

### Clear All Cache

```sql
DELETE FROM route_cache;
```

### Check Cache Age

```sql
SELECT mode, COUNT(*) as routes, 
       MAX(created_at) as last_cached,
       EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))/3600 as hours_old
FROM route_cache
GROUP BY mode;
```

## Performance Impact

### Before Caching:
- First request: 5-15 seconds ⏳
- Cache hit rate: 0%
- User experience: Slow, frustrating

### After Caching:
- Cached request: 10-50ms ⚡
- Cache hit rate: 70-90% (for popular routes)
- User experience: Instant, smooth

### Example Improvements:

| Route | Before | After | Speed Up |
|-------|--------|-------|----------|
| Subang Jaya → KLCC | 8.5s | 15ms | **567x faster** |
| Kelana Jaya → KL Sentral | 6.2s | 12ms | **517x faster** |
| Sunway → KLCC | 9.1s | 18ms | **506x faster** |

## Best Practices

1. **Run caching during off-peak hours**
   ```bash
   # Run at night or weekends
   npm run cache-transit-routes
   ```

2. **Re-cache periodically**
   - When GTFS data is updated
   - Monthly to ensure fresh data
   - After adding new routes

3. **Monitor cache hit rate**
   ```sql
   SELECT mode, 
          SUM(hit_count) as total_hits,
          COUNT(*) as total_routes,
          AVG(hit_count) as avg_hits_per_route
   FROM route_cache
   GROUP BY mode;
   ```

4. **Cache validation rules**
   - Invalid routes (same board/alight stop) are automatically skipped
   - Only valid routes are cached
   - Failed routes can be retried

## Troubleshooting

### Issue: Script hangs or times out

**Solution**: Reduce batch size in the script or run smaller subsets

### Issue: Many "No routes found" warnings

**Cause**: Some locations may not be well-connected by public transport  
**Solution**: This is normal - the script automatically skips these

### Issue: Cache not being used

**Check**:
```sql
-- Verify cache exists
SELECT * FROM route_cache WHERE mode = 'transit' LIMIT 5;

-- Check if cache is being hit
SELECT mode, SUM(hit_count) FROM route_cache GROUP BY mode;
```

### Issue: Outdated cached data

**Solution**: Clear and re-cache
```bash
# Clear old cache
psql -d your_database -c "DELETE FROM route_cache WHERE mode = 'transit';"

# Re-cache
npm run cache-transit-routes
```

## Technical Details

### Cache Storage

Routes are stored in the `route_cache` table:

```sql
CREATE TABLE route_cache (
    id SERIAL PRIMARY KEY,
    origin_lat DECIMAL(10, 8),
    origin_lon DECIMAL(11, 8),
    dest_lat DECIMAL(10, 8),
    dest_lon DECIMAL(11, 8),
    mode VARCHAR(20),
    geometry TEXT,  -- For transit: stores full route JSON
    distance DECIMAL(10, 3),
    duration DECIMAL(8, 2),
    emissions DECIMAL(10, 3),
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Cache Key

Routes are matched using:
- Origin coordinates (lat, lon)
- Destination coordinates (lat, lon)
- Mode (`'transit'`)
- Tolerance: ±0.01° (~1km)

### Cache Data

For transit routes, the `geometry` field stores the complete route JSON including:
- All transit steps (walk, bus, train, transfer)
- Stop information
- Route geometry (GTFS shapes)
- Timing and emissions

## Maintenance Schedule

### Weekly:
- Monitor cache hit rates
- Check for failed requests

### Monthly:
- Clear old cache
- Re-run `npm run cache-transit-routes`
- Verify popular routes are cached

### After GTFS Updates:
- Clear transit cache
- Re-cache all routes
- Test sample routes

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify GTFS data is properly imported
3. Ensure route_cache table exists
4. Check database connectivity

## Future Enhancements

Potential improvements:
- 🔄 Automatic cache refresh
- 📊 Cache analytics dashboard
- 🎯 Smart cache based on user patterns
- 🌍 Multi-region support
- ⏰ Time-based caching (peak hours)

