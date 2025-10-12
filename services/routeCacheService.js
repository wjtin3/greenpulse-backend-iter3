import { pool } from '../config/database.js';

/**
 * Route Cache Service
 * Caches frequently requested routes to dramatically speed up calculations
 */
class RouteCacheService {
    constructor() {
        this.cacheHitRate = { hits: 0, misses: 0 };
    }

    /**
     * Round coordinates to 100m precision for broader cache matching
     * This allows routes within ~100m to use the same cache entry
     */
    roundCoord(coord) {
        return Math.round(coord * 1000) / 1000;  // 3 decimal places = ~100m
    }

    /**
     * Generate cache key from route parameters
     */
    getCacheKey(originLat, originLon, destLat, destLon, mode) {
        return {
            originLat: this.roundCoord(originLat),
            originLon: this.roundCoord(originLon),
            destLat: this.roundCoord(destLat),
            destLon: this.roundCoord(destLon),
            mode: mode
        };
    }

    /**
     * Get cached route if available
     * Supports bidirectional lookup and proximity matching
     */
    async get(originLat, originLon, destLat, destLon, mode) {
        try {
            const key = this.getCacheKey(originLat, originLon, destLat, destLon, mode);
            
            // Try exact match first (A -> B)
            let result = await pool.query(`
                SELECT 
                    distance,
                    duration,
                    emissions,
                    geometry,
                    hit_count,
                    created_at,
                    origin_lat,
                    origin_lon,
                    dest_lat,
                    dest_lon,
                    false as reversed
                FROM route_cache
                WHERE origin_lat = $1
                  AND origin_lon = $2
                  AND dest_lat = $3
                  AND dest_lon = $4
                  AND mode = $5
                  AND expires_at > CURRENT_TIMESTAMP
                LIMIT 1
            `, [key.originLat, key.originLon, key.destLat, key.destLon, key.mode]);

            // If no exact match, try reverse direction (B -> A)
            if (result.rows.length === 0) {
                result = await pool.query(`
                    SELECT 
                        distance,
                        duration,
                        emissions,
                        geometry,
                        hit_count,
                        created_at,
                        origin_lat,
                        origin_lon,
                        dest_lat,
                        dest_lon,
                        true as reversed
                    FROM route_cache
                    WHERE origin_lat = $1
                      AND origin_lon = $2
                      AND dest_lat = $3
                      AND dest_lon = $4
                      AND mode = $5
                      AND expires_at > CURRENT_TIMESTAMP
                    LIMIT 1
                `, [key.destLat, key.destLon, key.originLat, key.originLon, key.mode]);
            }
            
            // If still no match, try proximity search (within ~1km)
            if (result.rows.length === 0) {
                result = await pool.query(`
                    SELECT 
                        distance,
                        duration,
                        emissions,
                        geometry,
                        hit_count,
                        created_at,
                        origin_lat,
                        origin_lon,
                        dest_lat,
                        dest_lon,
                        false as reversed,
                        SQRT(
                            POWER(origin_lat - $1, 2) + POWER(origin_lon - $2, 2) +
                            POWER(dest_lat - $3, 2) + POWER(dest_lon - $4, 2)
                        ) as distance_score
                    FROM route_cache
                    WHERE mode = $5
                      AND expires_at > CURRENT_TIMESTAMP
                      AND ABS(origin_lat - $1) < 0.01
                      AND ABS(origin_lon - $2) < 0.01
                      AND ABS(dest_lat - $3) < 0.01
                      AND ABS(dest_lon - $4) < 0.01
                    ORDER BY distance_score
                    LIMIT 1
                `, [key.originLat, key.originLon, key.destLat, key.destLon, key.mode]);
            }

            if (result.rows.length > 0) {
                const route = result.rows[0];
                
                // Cache hit! Increment hit count and extend expiration
                await pool.query(`
                    UPDATE route_cache
                    SET hit_count = hit_count + 1,
                        updated_at = CURRENT_TIMESTAMP,
                        expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
                    WHERE origin_lat = $1
                      AND origin_lon = $2
                      AND dest_lat = $3
                      AND dest_lon = $4
                      AND mode = $5
                `, [route.origin_lat, route.origin_lon, route.dest_lat, route.dest_lon, key.mode]);

                this.cacheHitRate.hits++;
                
                const matchType = route.reversed ? '(reversed)' : 
                                 route.distance_score ? '(proximity)' : '';
                console.log(`✅ Cache HIT: ${mode} route ${matchType} (${route.hit_count} hits, cached ${this.getAgeString(route.created_at)})`);
                
                // Handle transit routes differently (deserialize JSON)
                if (mode === 'transit') {
                    const transitData = JSON.parse(route.geometry);
                    return {
                        ...transitData,
                        cached: true,
                        cacheAge: route.created_at,
                        reversed: route.reversed
                    };
                } else {
                    // Simple routes (car, bike, walking)
                    return {
                        distance: parseFloat(route.distance),
                        duration: parseFloat(route.duration),
                        emissions: parseFloat(route.emissions),
                        geometry: route.geometry,
                        cached: true,
                        cacheAge: route.created_at,
                        reversed: route.reversed
                    };
                }
            }

            this.cacheHitRate.misses++;
            console.log(`❌ Cache MISS: ${mode} route - will calculate and cache`);
            return null;

        } catch (error) {
            console.error('Error getting cached route:', error);
            return null;  // Fall back to live calculation
        }
    }

    /**
     * Store route in cache
     */
    async set(originLat, originLon, destLat, destLon, mode, routeData) {
        try {
            const key = this.getCacheKey(originLat, originLon, destLat, destLon, mode);
            
            // Handle transit routes differently (complex structure)
            let distance, duration, emissions, geometry;
            
            if (mode === 'transit') {
                // For transit: store entire result as JSON, use 0 for numeric fields
                distance = 0;
                duration = 0;
                emissions = 0;
                geometry = JSON.stringify(routeData);
            } else {
                // For simple routes (car, bike, walking): store normally
                distance = routeData.distance;
                duration = routeData.duration;
                emissions = routeData.emissions;
                geometry = routeData.geometry;
            }
            
            await pool.query(`
                INSERT INTO route_cache (
                    origin_lat, origin_lon, dest_lat, dest_lon, mode,
                    distance, duration, emissions, geometry
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (origin_lat, origin_lon, dest_lat, dest_lon, mode)
                DO UPDATE SET
                    distance = EXCLUDED.distance,
                    duration = EXCLUDED.duration,
                    emissions = EXCLUDED.emissions,
                    geometry = EXCLUDED.geometry,
                    updated_at = CURRENT_TIMESTAMP,
                    expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
            `, [
                key.originLat, key.originLon, key.destLat, key.destLon, key.mode,
                distance, duration, emissions, geometry
            ]);

            console.log(`💾 Cached ${mode} route for future use`);
            return true;

        } catch (error) {
            console.error('Error caching route:', error);
            return false;
        }
    }

    /**
     * Pre-cache popular routes
     * Call this during off-peak hours or server startup
     */
    async preCachePopularRoutes(routes) {
        console.log(`🔄 Pre-caching ${routes.length} popular routes...`);
        let cached = 0;
        
        // Map modes to OSRM profiles
        const modeToProfile = {
            'car': 'driving',
            'bicycle': 'bike',
            'walking': 'foot'
        };
        
        for (const route of routes) {
            try {
                // Import RoutingService class here to avoid circular dependency
                const RoutingService = (await import('./routingService.js')).default;
                const routingService = new RoutingService();
                
                const osrmProfile = modeToProfile[route.mode] || 'driving';
                
                const result = await routingService.getRoute(
                    route.originLat, route.originLon,
                    route.destLat, route.destLon,
                    osrmProfile
                );
                
                if (result && result.distance) {
                    await this.set(
                        route.originLat, route.originLon,
                        route.destLat, route.destLon,
                        route.mode,  // Store using our mode (car/bicycle/walking)
                        result
                    );
                    cached++;
                    console.log(`  ✅ ${route.name}`);
                }
            } catch (error) {
                console.error(`  ❌ ${route.name}: ${error.message}`);
            }
        }
        
        console.log(`\n✅ Pre-cached ${cached}/${routes.length} routes`);
        return cached;
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            const result = await pool.query(`
                SELECT * FROM route_cache_stats
            `);
            
            const hitRate = this.cacheHitRate.hits + this.cacheHitRate.misses > 0
                ? ((this.cacheHitRate.hits / (this.cacheHitRate.hits + this.cacheHitRate.misses)) * 100).toFixed(1)
                : 0;

            return {
                byMode: result.rows,
                sessionHitRate: `${hitRate}%`,
                sessionHits: this.cacheHitRate.hits,
                sessionMisses: this.cacheHitRate.misses
            };
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return null;
        }
    }

    /**
     * Clean expired cache entries
     */
    async cleanExpired() {
        try {
            const result = await pool.query(`SELECT clean_expired_cache()`);
            const deleted = result.rows[0].clean_expired_cache;
            console.log(`🧹 Cleaned ${deleted} expired cache entries`);
            return deleted;
        } catch (error) {
            console.error('Error cleaning expired cache:', error);
            return 0;
        }
    }

    /**
     * Helper: Get human-readable age string
     */
    getAgeString(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
}

// Export singleton instance
export const routeCacheService = new RouteCacheService();

