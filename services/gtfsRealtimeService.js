import fetch from 'node-fetch';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { pool } from '../config/database.js';

/**
 * GTFS Realtime Service for fetching and storing vehicle position data
 * from Malaysia data.gov.my API (Prasarana)
 */
class GTFSRealtimeService {
    constructor() {
        this.baseUrl = 'https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana';
        this.availableCategories = ['rapid-bus-kl', 'rapid-bus-mrtfeeder'];
    }

    /**
     * Get available categories for realtime data
     */
    getAvailableCategories() {
        return this.availableCategories;
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
     * Fetch vehicle position data from the Prasarana API
     * @param {string} category - The category to fetch data for
     * @returns {Promise<Object>} - Parsed vehicle position data
     */
    async fetchVehiclePositions(category) {
        try {
            if (!this.availableCategories.includes(category)) {
                throw new Error(`Invalid category: ${category}. Available: ${this.availableCategories.join(', ')}`);
            }

            const url = `${this.baseUrl}?category=${category}`;
            console.log(`Fetching vehicle positions from: ${url}`);

            const response = await fetch(url);
            
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
            await client.query('BEGIN');

            const tableName = this.categoryToTableName(category);
            let deletedCount = 0;

            // Clear old data if requested
            if (clearOld) {
                const deleteResult = await client.query(
                    `DELETE FROM gtfs.vehicle_positions_${tableName}`
                );
                deletedCount = deleteResult.rowCount;
                console.log(`Deleted ${deletedCount} old records from vehicle_positions_${tableName}`);
            }

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
                    timestamp,
                    congestion_level,
                    occupancy_status,
                    vehicle_label,
                    vehicle_license_plate
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                )
                ON CONFLICT (vehicle_id, timestamp) 
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

            // Insert each vehicle position
            for (const entity of entities) {
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
                    console.error(`Error inserting vehicle position:`, insertError.message);
                    skippedCount++;
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

