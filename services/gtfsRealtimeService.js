import fetch from 'node-fetch';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { pool } from '../config/database.js';

/**
 * GTFS Realtime Service for fetching and storing vehicle position data
 * from Malaysia data.gov.my API (Prasarana)
 */
class GTFSRealtimeService {
    constructor() {
        // Base URLs for different providers
        this.baseUrls = {
            prasarana: 'https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana',
            ktmb: 'https://api.data.gov.my/gtfs-realtime/vehicle-position/ktmb'
        };
        
        // Available categories by provider
        this.availableCategories = {
            prasarana: ['rapid-bus-kl', 'rapid-bus-mrtfeeder'],
            ktmb: ['ktmb']  // KTMB doesn't use category parameter
        };
        
        // Legacy support
        this.baseUrl = this.baseUrls.prasarana;
    }

    /**
     * Get available categories for realtime data
     */
    getAvailableCategories() {
        // Return all categories flat
        return [
            ...this.availableCategories.prasarana,
            ...this.availableCategories.ktmb
        ];
    }
    
    /**
     * Get all categories by provider
     */
    getAllCategoriesByProvider() {
        return this.availableCategories;
    }

    /**
     * Initialize real-time data on server startup
     * Fetches initial data for all categories
     */
    async initializeRealtimeData() {
        console.log('🚀 Initializing real-time vehicle tracking...');
        const categories = this.getAvailableCategories();
        
        for (const category of categories) {
            try {
                console.log(`  📡 Fetching initial data for ${category}`);
                await this.refreshVehiclePositions(category);
            } catch (error) {
                console.error(`  ❌ Failed to initialize ${category}:`, error.message);
            }
        }
        
        console.log('✅ Real-time vehicle tracking initialized');
    }

    /**
     * Start periodic refresh of real-time data (every 2 minutes)
     * @returns {NodeJS.Timeout} The interval ID
     */
    startPeriodicRefresh() {
        const REFRESH_INTERVAL = 120000; // 2 minutes
        
        console.log('🔄 Starting periodic real-time data refresh (every 2 minutes)');
        
        const intervalId = setInterval(async () => {
            console.log('\n⏰ Periodic refresh triggered');
            const categories = this.getAvailableCategories();
            
            for (const category of categories) {
                try {
                    await this.refreshVehiclePositions(category);
                } catch (error) {
                    console.error(`  ❌ Failed to refresh ${category}:`, error.message);
                }
            }
        }, REFRESH_INTERVAL);
        
        return intervalId;
    }

    /**
     * Convert category name to database table name format
     * @param {string} category - The category name (rapid-bus-kl, rapid-bus-mrtfeeder)
     * @returns {string} - Database table name format (rapid_bus_kl, rapid_bus_mrtfeeder)
     */
    categoryToTableName(category) {
        return category.replace(/-/g, '_');
    }

    /**
     * Fetch vehicle position data from data.gov.my API
     * @param {string} category - The category to fetch data for (rapid-bus-kl, rapid-bus-mrtfeeder, ktmb)
     * @returns {Promise<Object>} - Parsed vehicle position data
     */
    async fetchVehiclePositions(category) {
        try {
            // Check which provider this category belongs to
            let provider = null;
            let url = null;
            
            if (this.availableCategories.prasarana.includes(category)) {
                provider = 'prasarana';
                url = `${this.baseUrls.prasarana}?category=${category}`;
            } else if (this.availableCategories.ktmb.includes(category)) {
                provider = 'ktmb';
                url = this.baseUrls.ktmb;  // KTMB doesn't use category parameter
            } else {
                const allCategories = this.getAvailableCategories();
                throw new Error(`Invalid category: ${category}. Available: ${allCategories.join(', ')}`);
            }

            console.log(`Fetching vehicle positions for ${category} (${provider}) from: ${url}`);

            const response = await fetch(url, {
                timeout: 10000  // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            // Get the protobuf data as a buffer
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);

            // Parse the protobuf data
            const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(uint8Array);

            console.log(`Successfully fetched ${feed.entity.length} vehicle positions for ${category}`);

            return {
                success: true,
                category: category,
                feedHeader: {
                    gtfsRealtimeVersion: feed.header.gtfsRealtimeVersion,
                    incrementality: feed.header.incrementality,
                    timestamp: feed.header.timestamp ? feed.header.timestamp.toString() : null,
                },
                entities: feed.entity,
                count: feed.entity.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error fetching vehicle positions for ${category}:`, error.message);
            return {
                success: false,
                category: category,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Store vehicle positions in the database
     * @param {string} category - The category
     * @param {Array} entities - Array of vehicle position entities
     * @param {boolean} clearOld - Whether to clear old data before inserting
     * @returns {Promise<Object>} - Insert result
     */
    async storeVehiclePositions(category, entities, clearOld = true) {
        const client = await pool.connect();
        
        try {
            // Set statement timeout to 60 seconds for large inserts
            await client.query('SET statement_timeout = 60000');
            await client.query('BEGIN');

            const tableName = this.categoryToTableName(category);
            let deletedCount = 0;

            // Prepare insert query
            const insertQuery = `
                INSERT INTO gtfs.vehicle_positions_${tableName} (
                    vehicle_id,
                    trip_id,
                    route_id,
                    trip_start_time,
                    trip_start_date,
                    direction_id,
                    schedule_relationship,
                    latitude,
                    longitude,
                    bearing,
                    odometer,
                    speed,
                    current_stop_sequence,
                    stop_id,
                    current_status,
                    position_timestamp,
                    congestion_level,
                    occupancy_status,
                    vehicle_label,
                    vehicle_license_plate
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                )
                ON CONFLICT (vehicle_id, position_timestamp) 
                DO UPDATE SET
                    trip_id = EXCLUDED.trip_id,
                    route_id = EXCLUDED.route_id,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    bearing = EXCLUDED.bearing,
                    speed = EXCLUDED.speed,
                    current_status = EXCLUDED.current_status,
                    updated_at = CURRENT_TIMESTAMP
            `;

            let insertedCount = 0;
            let skippedCount = 0;

            // Batch insert for better performance (process in chunks of 50)
            const batchSize = 50;
            for (let i = 0; i < entities.length; i += batchSize) {
                const batch = entities.slice(i, i + batchSize);
                
                for (const entity of batch) {
                    if (!entity.vehicle || !entity.vehicle.position) {
                        skippedCount++;
                        continue;
                    }

                    const vehicle = entity.vehicle;
                    const position = vehicle.position;
                    const trip = vehicle.trip || {};
                    const vehicleDesc = vehicle.vehicle || {};

                    try {
                        await client.query(insertQuery, [
                            entity.id || null,
                            trip.tripId || null,
                            trip.routeId || null,
                            trip.startTime || null,
                            trip.startDate || null,
                            trip.directionId !== undefined ? trip.directionId : null,
                            trip.scheduleRelationship || null,
                            position.latitude,
                            position.longitude,
                            position.bearing !== undefined ? position.bearing : null,
                            position.odometer !== undefined ? position.odometer : null,
                            position.speed !== undefined ? position.speed : null,
                            vehicle.currentStopSequence !== undefined ? vehicle.currentStopSequence : null,
                            vehicle.stopId || null,
                            vehicle.currentStatus || null,
                            vehicle.timestamp ? vehicle.timestamp.toString() : Date.now().toString(),
                            vehicle.congestionLevel || null,
                            vehicle.occupancyStatus || null,
                            vehicleDesc.label || null,
                            vehicleDesc.licensePlate || null
                        ]);
                        insertedCount++;
                    } catch (insertError) {
                        // Skip individual insert errors (e.g., constraint violations)
                        skippedCount++;
                    }
                }
                
                // Log progress for large batches
                if (entities.length > 50) {
                    console.log(`  Progress: ${Math.min(i + batchSize, entities.length)}/${entities.length} vehicles processed`);
                }
            }

            // NOW delete old data AFTER inserting new data (prevents gap in data availability)
            // IMPORTANT: Keep at least 2 versions of vehicle data for fallback
            if (clearOld) {
                console.log(`  Checking if old vehicle data cleanup is needed...`);
                
                // First, check how many distinct versions we have
                const versionCheckResult = await client.query(
                    `SELECT COUNT(DISTINCT created_at) as version_count 
                     FROM gtfs.vehicle_positions_${tableName}`
                );
                const currentVersionCount = versionCheckResult.rows[0]?.version_count || 0;
                console.log(`  Current versions in database: ${currentVersionCount}`);
                
                // Only delete old data if we have MORE than 2 versions
                // This ensures at least 2 versions are always available as fallback
                if (currentVersionCount > 2) {
                    console.log(`  Cleaning up old vehicle data (keeping 2 most recent versions)...`);
                    
                    // Delete all but the 2 most recent batches of data
                    // This keeps the current update + the previous update as fallback
                    const deleteResult = await client.query(
                        `DELETE FROM gtfs.vehicle_positions_${tableName}
                         WHERE created_at < (
                           SELECT DISTINCT created_at 
                           FROM gtfs.vehicle_positions_${tableName}
                           ORDER BY created_at DESC
                           OFFSET 2
                           LIMIT 1
                         )
                         AND created_at < NOW() - INTERVAL '10 minutes'` // Safety: never delete data less than 10 min old
                    );
                    deletedCount = deleteResult.rowCount;
                    
                    // Verify final version count
                    const finalVersionResult = await client.query(
                        `SELECT COUNT(DISTINCT created_at) as version_count 
                         FROM gtfs.vehicle_positions_${tableName}`
                    );
                    const finalVersionCount = finalVersionResult.rows[0]?.version_count || 0;
                    console.log(`  ✓ Cleaned up ${deletedCount} old records (${finalVersionCount} versions remaining)`);
                } else {
                    console.log(`  ⚠️  Skipping cleanup - only ${currentVersionCount} version(s) available (minimum 2 required for deletion)`);
                    deletedCount = 0;
                }
            }

            await client.query('COMMIT');

            console.log(`Stored ${insertedCount} vehicle positions for ${category} (${skippedCount} skipped)`);

            return {
                success: true,
                category: category,
                tableName: `vehicle_positions_${tableName}`,
                deletedCount: deletedCount,
                insertedCount: insertedCount,
                skippedCount: skippedCount,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error storing vehicle positions for ${category}:`, error.message);
            
            return {
                success: false,
                category: category,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    }

    /**
     * Fetch and store vehicle positions in one operation
     * @param {string} category - The category
     * @param {boolean} clearOld - Whether to clear old data before inserting
     * @returns {Promise<Object>} - Operation result
     */
    async refreshVehiclePositions(category, clearOld = true) {
        try {
            console.log(`\n=== Refreshing vehicle positions for ${category} ===`);

            // Fetch the data
            const fetchResult = await this.fetchVehiclePositions(category);
            
            if (!fetchResult.success) {
                return fetchResult;
            }

            // Store the data
            const storeResult = await this.storeVehiclePositions(
                category,
                fetchResult.entities,
                clearOld
            );

            return {
                success: storeResult.success,
                category: category,
                fetch: {
                    count: fetchResult.count,
                    feedTimestamp: fetchResult.feedHeader.timestamp
                },
                store: {
                    deletedCount: storeResult.deletedCount,
                    insertedCount: storeResult.insertedCount,
                    skippedCount: storeResult.skippedCount
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error refreshing vehicle positions for ${category}:`, error.message);
            return {
                success: false,
                category: category,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Refresh vehicle positions for multiple categories
     * @param {Array<string>} categories - Array of categories to refresh
     * @param {boolean} clearOld - Whether to clear old data before inserting
     * @returns {Promise<Array>} - Array of results
     */
    async refreshMultipleCategories(categories, clearOld = true) {
        const results = [];

        for (const category of categories) {
            const result = await this.refreshVehiclePositions(category, clearOld);
            results.push(result);
        }

        return results;
    }

    /**
     * Refresh all available categories
     * @param {boolean} clearOld - Whether to clear old data before inserting
     * @returns {Promise<Array>} - Array of results
     */
    async refreshAllCategories(clearOld = true) {
        return await this.refreshMultipleCategories(this.availableCategories, clearOld);
    }

    /**
     * Clean up old vehicle position records
     * @param {string} category - The category
     * @param {number} hoursToKeep - Number of hours of data to keep (default: 24)
     * @returns {Promise<Object>} - Cleanup result
     */
    async cleanupOldRecords(category, hoursToKeep = 24) {
        const client = await pool.connect();
        
        try {
            const tableName = this.categoryToTableName(category);
            
            const result = await client.query(
                `SELECT gtfs.cleanup_old_vehicle_positions($1, $2) as deleted_count`,
                [tableName, hoursToKeep]
            );

            const deletedCount = result.rows[0].deleted_count;
            console.log(`Cleaned up ${deletedCount} old records from ${category} (kept last ${hoursToKeep} hours)`);

            return {
                success: true,
                category: category,
                deletedCount: deletedCount,
                hoursKept: hoursToKeep,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error cleaning up old records for ${category}:`, error.message);
            return {
                success: false,
                category: category,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    }

    /**
     * Get latest vehicle positions from database
     * @param {string} category - The category
     * @param {number} minutesOld - How old the data can be in minutes (default: 10)
     * @returns {Promise<Object>} - Vehicle positions
     */
    async getLatestVehiclePositions(category, minutesOld = 10) {
        const client = await pool.connect();
        
        try {
            const tableName = this.categoryToTableName(category);
            
            const result = await client.query(
                `SELECT * FROM gtfs.get_latest_vehicle_positions($1, $2)`,
                [tableName, minutesOld]
            );

            return {
                success: true,
                category: category,
                vehicles: result.rows,
                count: result.rows.length,
                minutesOld: minutesOld,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error getting latest vehicle positions for ${category}:`, error.message);
            return {
                success: false,
                category: category,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    }

    /**
     * Get vehicle positions within a radius
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} radiusKm - Radius in kilometers
     * @param {string} category - The category
     * @param {number} minutesOld - How old the data can be in minutes
     * @returns {Promise<Object>} - Vehicle positions within radius
     */
    async getVehiclePositionsNearby(lat, lon, radiusKm, category, minutesOld = 10) {
        const client = await pool.connect();
        
        try {
            const tableName = this.categoryToTableName(category);
            
            const result = await client.query(
                `SELECT * FROM gtfs.get_vehicle_positions_within_radius($1, $2, $3, $4, $5)`,
                [lat, lon, radiusKm, tableName, minutesOld]
            );

            return {
                success: true,
                category: category,
                location: { latitude: lat, longitude: lon },
                radiusKm: radiusKm,
                vehicles: result.rows,
                count: result.rows.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error getting nearby vehicle positions:`, error.message);
            return {
                success: false,
                category: category,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    }

    /**
     * Get all current vehicle positions across all categories
     * @returns {Promise<Object>} - All vehicle positions
     */
    async getAllCurrentVehiclePositions() {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `SELECT * FROM gtfs.all_vehicle_positions_current ORDER BY created_at DESC`
            );

            // Group by category
            const groupedByCategory = {};
            for (const row of result.rows) {
                if (!groupedByCategory[row.category]) {
                    groupedByCategory[row.category] = [];
                }
                groupedByCategory[row.category].push(row);
            }

            return {
                success: true,
                vehicles: result.rows,
                byCategory: groupedByCategory,
                totalCount: result.rows.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error getting all current vehicle positions:`, error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    }

    /**
     * Get vehicle positions for a specific route
     * @param {string} category - The category
     * @param {string} routeId - The route ID
     * @param {Object} options - Filter options
     * @param {number} options.minutesOld - How old the data can be in minutes (default: 10)
     * @param {number} options.directionId - Filter by direction (0 or 1)
     * @param {number} options.minStopSequence - Minimum stop sequence (filter vehicles ahead)
     * @param {number} options.maxStopSequence - Maximum stop sequence (filter vehicles behind)
     * @returns {Promise<Object>} - Vehicle positions for the route
     */
    async getVehiclePositionsForRoute(category, routeId, options = {}) {
        const client = await pool.connect();
        
        try {
            const tableName = this.categoryToTableName(category);
            const minutesOld = options.minutesOld || 10;
            
            // Build dynamic WHERE clause
            let whereConditions = [
                `route_id = $1`
            ];
            
            // Only apply time constraint if minutesOld is not -1 (special value for "most recent regardless of age")
            if (minutesOld !== -1) {
                whereConditions.push(`created_at >= NOW() - INTERVAL '${minutesOld} minutes'`);
            }
            
            const params = [routeId];
            let paramIndex = 2;
            
            // Filter by direction if specified
            // Include vehicles with NULL direction_id (they belong to all directions)
            if (options.directionId !== undefined && options.directionId !== null) {
                whereConditions.push(`(direction_id = $${paramIndex} OR direction_id IS NULL)`);
                params.push(options.directionId);
                paramIndex++;
            }
            
            // Filter by stop sequence range if specified
            if (options.minStopSequence !== undefined && options.maxStopSequence !== undefined) {
                whereConditions.push(`current_stop_sequence >= $${paramIndex}`);
                params.push(options.minStopSequence);
                paramIndex++;
                
                whereConditions.push(`current_stop_sequence <= $${paramIndex}`);
                params.push(options.maxStopSequence);
                paramIndex++;
            }
            
            const query = `
                SELECT 
                    vehicle_id,
                    trip_id,
                    route_id,
                    direction_id,
                    latitude,
                    longitude,
                    bearing,
                    speed,
                    current_stop_sequence,
                    stop_id,
                    current_status,
                    position_timestamp,
                    vehicle_label,
                    vehicle_license_plate,
                    created_at
                FROM gtfs.vehicle_positions_${tableName}
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY created_at DESC
            `;
            
            const result = await client.query(query, params);

            console.log(`Found ${result.rows.length} vehicles for route ${routeId} in ${category} (${Object.keys(options).length} filters applied)`);

            // Get the most recent data timestamp (for smart refresh)
            // IMPORTANT: Add explicit UTC timezone to prevent frontend parsing issues
            const mostRecentDataTimestamp = result.rows.length > 0 
                ? new Date(result.rows[0].created_at + '+00').toISOString()
                : null;

            return {
                success: true,
                category: category,
                routeId: routeId,
                vehicles: result.rows,
                count: result.rows.length,
                filters: options,
                timestamp: new Date().toISOString(),
                mostRecentDataTimestamp: mostRecentDataTimestamp
            };

        } catch (error) {
            console.error(`Error getting vehicle positions for route ${routeId}:`, error.message);
            return {
                success: false,
                category: category,
                routeId: routeId,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    }

    /**
     * Get vehicle positions for multiple routes (useful for transfer routes)
     * @param {Array} routes - Array of {category, routeId, options} objects
     * @returns {Promise<Object>} - Vehicle positions for all routes
     */
    async getVehiclePositionsForMultipleRoutes(routes) {
        try {
            // ✅ ON-DEMAND: Only fetch fresh data if stale (>90 seconds old)
            // This reduces DB writes dramatically on Neon free tier
            const categoriesToRefresh = new Set();
            
            for (const route of routes) {
                categoriesToRefresh.add(route.category);
            }
            
            // Check if we need to refresh each category
            const client = await pool.connect();
            try {
                for (const category of categoriesToRefresh) {
                    const tableName = this.categoryToTableName(category);
                    
                    // Check if table exists and has recent data
                    const result = await client.query(
                        `SELECT MAX(created_at) as latest, COUNT(*) as count 
                         FROM gtfs.vehicle_positions_${tableName}`
                    );
                    
                    const latestTimestamp = result.rows[0]?.latest;
                    const vehicleCount = parseInt(result.rows[0]?.count) || 0;
                    const ageSeconds = latestTimestamp ? 
                        Math.round((Date.now() - new Date(latestTimestamp).getTime()) / 1000) : null;
                    
                    // Refresh if: no data, OR data is older than 2 minutes
                    const needsRefresh = !latestTimestamp || 
                        vehicleCount === 0 ||
                        (Date.now() - new Date(latestTimestamp).getTime()) > 120000; // 120 seconds (2 minutes)
                    
                    if (needsRefresh) {
                        if (!latestTimestamp || vehicleCount === 0) {
                            console.log(`♻️ No data found for ${category}, fetching fresh data (on-demand)`);
                        } else {
                            console.log(`♻️ Refreshing stale data for ${category} (${ageSeconds}s old, on-demand)`);
                        }
                        
                        try {
                            const refreshResult = await this.refreshVehiclePositions(category);
                            if (!refreshResult.success) {
                                console.warn(`⚠️ Failed to refresh ${category}:`, refreshResult.error);
                            } else {
                                console.log(`✅ Refreshed ${category}: ${refreshResult.store.insertedCount} vehicles`);
                            }
                        } catch (refreshError) {
                            console.error(`❌ Error refreshing ${category}:`, refreshError.message);
                        }
                    } else {
                        console.log(`✅ Using cached data for ${category} (${ageSeconds}s old, ${vehicleCount} vehicles)`);
                    }
                }
            } catch (dbError) {
                console.error(`❌ Database error in refresh check:`, dbError.message);
            } finally {
                client.release();
            }
            
            // Now query the database for the specific routes
            const results = await Promise.all(
                routes.map(route => 
                    this.getVehiclePositionsForRoute(
                        route.category, 
                        route.routeId, 
                        route.options || {}
                    )
                )
            );

            // Combine all vehicles
            const allVehicles = results.flatMap(r => r.vehicles || []);

            // Find the most recent data timestamp across all routes
            // Timestamps are already in ISO format with UTC indicator from individual route queries
            const mostRecentDataTimestamp = results
                .map(r => r.mostRecentDataTimestamp)
                .filter(t => t !== null)
                .sort((a, b) => new Date(b) - new Date(a))[0] || null;

            console.log(`📊 Vehicle query complete: ${allVehicles.length} total vehicles for ${routes.length} routes`);

            return {
                success: true,
                routes: routes,
                vehicles: allVehicles,
                totalCount: allVehicles.length,
                byRoute: results,
                timestamp: new Date().toISOString(),
                mostRecentDataTimestamp: mostRecentDataTimestamp
            };

        } catch (error) {
            console.error(`❌ Error getting vehicle positions for multiple routes:`, error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get service health information
     * @returns {Promise<Object>} - Service health info
     */
    async getServiceHealth() {
        const client = await pool.connect();
        
        try {
            const results = {};
            
            for (const category of this.availableCategories) {
                const tableName = this.categoryToTableName(category);
                
                // Get count of records in last 10 minutes
                const countResult = await client.query(
                    `SELECT COUNT(*) as count FROM gtfs.vehicle_positions_${tableName} 
                     WHERE created_at >= NOW() - INTERVAL '10 minutes'`
                );
                
                // Get latest timestamp
                const latestResult = await client.query(
                    `SELECT MAX(created_at) as latest FROM gtfs.vehicle_positions_${tableName}`
                );

                results[category] = {
                    recentVehicles: parseInt(countResult.rows[0].count),
                    latestUpdate: latestResult.rows[0].latest
                };
            }

            return {
                success: true,
                service: 'GTFS Realtime Vehicle Positions',
                status: 'healthy',
                baseUrl: this.baseUrl,
                availableCategories: this.availableCategories,
                categoryStatus: results,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error getting service health:`, error.message);
            return {
                success: false,
                service: 'GTFS Realtime Vehicle Positions',
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    }
}

export default GTFSRealtimeService;

