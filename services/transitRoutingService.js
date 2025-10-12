import { pool } from '../config/database.js';
import { routeCacheService } from './routeCacheService.js';
import RoutingService from './routingService.js';

/**
 * Transit Routing Service using GTFS Data
 * Provides public transport routing with step-by-step directions
 */
class TransitRoutingService {
    constructor() {
        this.routingService = new RoutingService();
        
        // Emission factors for public transport (kg CO2 per km per passenger)
        this.emissionFactors = {
            bus: 0.089,
            mrt: 0.023,
            lrt: 0.023,
            monorail: 0.023,
            train: 0.041
        };

        // Walking speed (km/h)
        this.walkingSpeed = 5;
        
        // Maximum walking distance to/from stops (km)
        this.maxWalkingDistance = 5.0; // Increased from 1.5km to 5.0km for wider coverage

        // GTFS categories
        this.categories = ['rapid_bus_kl', 'rapid_bus_mrtfeeder', 'rapid_rail_kl', 'ktmb'];
    }

    /**
     * Calculate distance between two coordinates (Haversine)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Get walking route geometry from OSRM
     * NOTE: Disabled because OSRM public server doesn't have proper foot profiles for Malaysia,
     * causing misleading routes that follow car roads instead of pedestrian paths.
     * Straight lines are more honest about showing walking distance.
     */
    async getWalkingGeometry(fromLat, fromLon, toLat, toLon) {
        // Return null to use straight lines instead of misleading car-road-based walking routes
        return null;
    }

    /**
     * Find stops near a location across all GTFS categories
     * Returns top N stops from EACH category (not just top N overall)
     */
    async findNearbyStops(latitude, longitude, radiusKm = 5.0, limit = 20) {
        const client = await pool.connect();
        
        try {
            const allStops = [];
            const stopsPerCategory = Math.ceil(limit / this.categories.length); // Distribute limit across categories

            for (const category of this.categories) {
                try {
                    const query = `
                        SELECT 
                            stop_id,
                            stop_name,
                            stop_code,
                            stop_lat,
                            stop_lon,
                            ROUND(
                                (6371 * acos(
                                    LEAST(1, GREATEST(-1,
                                        cos(radians($1)) * cos(radians(stop_lat)) * 
                                        cos(radians(stop_lon) - radians($2)) + 
                                        sin(radians($1)) * sin(radians(stop_lat))
                                    ))
                                ))::NUMERIC, 3
                            ) as distance_km,
                            $3 as category
                        FROM gtfs.stops_${category}
                        WHERE 6371 * acos(
                            LEAST(1, GREATEST(-1,
                                cos(radians($1)) * cos(radians(stop_lat)) * 
                                cos(radians(stop_lon) - radians($2)) + 
                                sin(radians($1)) * sin(radians(stop_lat))
                            ))
                        ) <= $4
                        ORDER BY distance_km
                        LIMIT $5
                    `;

                    const result = await client.query(query, [
                        latitude,
                        longitude,
                        category.replace(/_/g, '-'),
                        radiusKm,
                        stopsPerCategory  // Get top N from each category
                    ]);

                    allStops.push(...result.rows);
                } catch (err) {
                    console.log(`Category ${category} not available:`, err.message);
                }
            }

            // Sort all stops by distance
            allStops.sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km));
            return allStops;  // Return all stops from all categories (up to N per category)

        } finally {
            client.release();
        }
    }

    /**
     * Find routes serving a specific stop
     */
    async getRoutesAtStop(stopId, category) {
        const client = await pool.connect();
        
        try {
            const categoryTable = category.replace(/-/g, '_');
            
            const query = `
                SELECT DISTINCT
                    r.route_id,
                    r.route_short_name,
                    r.route_long_name,
                    r.route_type,
                    r.route_color
                FROM gtfs.routes_${categoryTable} r
                JOIN gtfs.trips_${categoryTable} t ON r.route_id = t.route_id
                JOIN gtfs.stop_times_${categoryTable} st ON t.trip_id = st.trip_id
                WHERE st.stop_id = $1
                ORDER BY r.route_short_name
            `;

            const result = await client.query(query, [stopId]);
            return result.rows;

        } finally {
            client.release();
        }
    }

    /**
     * Find connecting routes between two stops
     */
    async findConnectingRoutes(originStopId, destStopId, originCategory, destCategory) {
        const client = await pool.connect();
        
        try {
            // Check if stops are on the same route (direct connection)
            const directRoutes = await this.findDirectRoutes(
                originStopId, 
                destStopId, 
                originCategory, 
                destCategory,
                client
            );

            if (directRoutes.length > 0) {
                return { direct: directRoutes, transfers: [] };
            }

            // Find routes requiring one transfer
            const transferRoutes = await this.findTransferRoutes(
                originStopId,
                destStopId,
                originCategory,
                destCategory,
                client
            );

            return { direct: [], transfers: transferRoutes };

        } finally {
            client.release();
        }
    }

    /**
     * Find direct routes (no transfers)
     */
    async findDirectRoutes(originStopId, destStopId, originCategory, destCategory, client) {
        if (originCategory !== destCategory) {
            return []; // Different systems, need transfer
        }

        const categoryTable = originCategory.replace(/-/g, '_');

        try {
            const query = `
                SELECT DISTINCT
                    r.route_id,
                    r.route_short_name,
                    r.route_long_name,
                    r.route_type,
                    t.trip_id,
                    t.trip_headsign,
                    st1.stop_sequence as origin_sequence,
                    st2.stop_sequence as dest_sequence,
                    st1.departure_time as origin_departure,
                    st2.arrival_time as dest_arrival
                FROM gtfs.routes_${categoryTable} r
                JOIN gtfs.trips_${categoryTable} t ON r.route_id = t.route_id
                JOIN gtfs.stop_times_${categoryTable} st1 ON t.trip_id = st1.trip_id
                JOIN gtfs.stop_times_${categoryTable} st2 ON t.trip_id = st2.trip_id
                WHERE st1.stop_id = $1
                AND st2.stop_id = $2
                AND st1.stop_sequence < st2.stop_sequence
                ORDER BY r.route_short_name
                LIMIT 5
            `;

            const result = await client.query(query, [originStopId, destStopId]);
            return result.rows.map(row => ({
                ...row,
                category: originCategory,
                type: 'direct'
            }));
        } catch (err) {
            console.error('Error finding direct routes:', err.message);
            return [];
        }
    }

    /**
     * Find routes with one transfer
     */
    async findTransferRoutes(originStopId, destStopId, originCategory, destCategory, client) {
        try {
            const transferRoutes = [];

            // If same category, find transfer via intermediate stops
            if (originCategory === destCategory) {
                const categoryTable = originCategory.replace(/-/g, '_');

                // Find routes from origin that could be first leg
                const firstLegQuery = `
                    SELECT DISTINCT
                        r1.route_id as route1_id,
                        r1.route_short_name as route1_name,
                        r1.route_long_name as route1_long_name,
                        r1.route_type as route1_type,
                        t1.trip_id as trip1_id,
                        t1.trip_headsign as trip1_headsign,
                        st1.stop_id as transfer_stop_id,
                        st1.stop_sequence as transfer_sequence,
                        s_transfer.stop_name as transfer_stop_name,
                        s_transfer.stop_lat as transfer_stop_lat,
                        s_transfer.stop_lon as transfer_stop_lon
                    FROM gtfs.routes_${categoryTable} r1
                    JOIN gtfs.trips_${categoryTable} t1 ON r1.route_id = t1.route_id
                    JOIN gtfs.stop_times_${categoryTable} st_origin ON t1.trip_id = st_origin.trip_id
                    JOIN gtfs.stop_times_${categoryTable} st1 ON t1.trip_id = st1.trip_id
                    JOIN gtfs.stops_${categoryTable} s_transfer ON st1.stop_id = s_transfer.stop_id
                    WHERE st_origin.stop_id = $1
                    AND st_origin.stop_sequence < st1.stop_sequence
                    LIMIT 10
                `;

                const firstLegResult = await client.query(firstLegQuery, [originStopId]);

                // Limit transfer points to check for speed
                const maxTransferPoints = 5;
                
                // For each potential transfer point, find routes to destination
                for (const firstLeg of firstLegResult.rows.slice(0, maxTransferPoints)) {
                    // Skip if transfer stop is the same as destination (invalid transfer)
                    if (firstLeg.transfer_stop_id === destStopId) {
                        console.log(`⚠️  Skipping invalid transfer: transfer stop ${firstLeg.transfer_stop_id} is the destination`);
                        continue;
                    }
                    
                    const secondLegQuery = `
                        SELECT DISTINCT
                            r2.route_id as route2_id,
                            r2.route_short_name as route2_name,
                            r2.route_long_name as route2_long_name,
                            r2.route_type as route2_type,
                            t2.trip_id as trip2_id,
                            t2.trip_headsign as trip2_headsign,
                            st2_origin.stop_sequence as transfer_origin_sequence,
                            st2_dest.stop_sequence as dest_sequence
                        FROM gtfs.routes_${categoryTable} r2
                        JOIN gtfs.trips_${categoryTable} t2 ON r2.route_id = t2.route_id
                        JOIN gtfs.stop_times_${categoryTable} st2_origin ON t2.trip_id = st2_origin.trip_id
                        JOIN gtfs.stop_times_${categoryTable} st2_dest ON t2.trip_id = st2_dest.trip_id
                        WHERE st2_origin.stop_id = $1
                        AND st2_dest.stop_id = $2
                        AND st2_origin.stop_sequence < st2_dest.stop_sequence
                        AND r2.route_id != $3
                        LIMIT 3
                    `;

                    const secondLegResult = await client.query(secondLegQuery, [
                        firstLeg.transfer_stop_id,
                        destStopId,
                        firstLeg.route1_id // Different route for second leg
                    ]);

                    if (secondLegResult.rows.length > 0) {
                        for (const secondLeg of secondLegResult.rows) {
                            transferRoutes.push({
                                ...firstLeg,
                                ...secondLeg,
                                category: originCategory,
                                type: 'transfer'
                            });
                        }
                    }
                }
            } else {
                // Different categories - find nearby stops that could serve as transfer points
                // Get all stops from first category's routes
                const originCategoryTable = originCategory.replace(/-/g, '_');
                const destCategoryTable = destCategory.replace(/-/g, '_');

                // Find stops on routes from origin
                const originRoutesQuery = `
                    SELECT DISTINCT
                        r.route_id,
                        r.route_short_name,
                        r.route_long_name,
                        r.route_type,
                        t.trip_id,
                        t.trip_headsign,
                        st_end.stop_id as end_stop_id,
                        s_end.stop_name as end_stop_name,
                        s_end.stop_lat as end_stop_lat,
                        s_end.stop_lon as end_stop_lon
                    FROM gtfs.routes_${originCategoryTable} r
                    JOIN gtfs.trips_${originCategoryTable} t ON r.route_id = t.route_id
                    JOIN gtfs.stop_times_${originCategoryTable} st_origin ON t.trip_id = st_origin.trip_id
                    JOIN gtfs.stop_times_${originCategoryTable} st_end ON t.trip_id = st_end.trip_id
                    JOIN gtfs.stops_${originCategoryTable} s_end ON st_end.stop_id = s_end.stop_id
                    WHERE st_origin.stop_id = $1
                    AND st_origin.stop_sequence < st_end.stop_sequence
                    LIMIT 20
                `;

                const originRoutes = await client.query(originRoutesQuery, [originStopId]);

                // For each end stop, find nearby stops in destination category
                for (const originRoute of originRoutes.rows) {
                    const nearbyDestStopsQuery = `
                        SELECT 
                            s.stop_id,
                            s.stop_name,
                            s.stop_lat,
                            s.stop_lon,
                            ROUND(
                                (6371 * acos(
                                    LEAST(1, GREATEST(-1,
                                        cos(radians($1)) * cos(radians(s.stop_lat)) * 
                                        cos(radians(s.stop_lon) - radians($2)) + 
                                        sin(radians($1)) * sin(radians(s.stop_lat))
                                    ))
                                ))::NUMERIC, 3
                            ) as distance_km
                        FROM gtfs.stops_${destCategoryTable} s
                        WHERE 6371 * acos(
                            LEAST(1, GREATEST(-1,
                                cos(radians($1)) * cos(radians(s.stop_lat)) * 
                                cos(radians(s.stop_lon) - radians($2)) + 
                                sin(radians($1)) * sin(radians(s.stop_lat))
                            ))
                        ) <= 0.5
                        ORDER BY distance_km
                        LIMIT 3
                    `;

                    const nearbyStops = await client.query(nearbyDestStopsQuery, [
                        originRoute.end_stop_lat,
                        originRoute.end_stop_lon
                    ]);

                    // Find routes from these nearby stops to destination
                    for (const transferStop of nearbyStops.rows) {
                        // Skip if transfer stop is the same as destination (invalid transfer)
                        if (transferStop.stop_id === destStopId) {
                            console.log(`⚠️  Skipping invalid cross-category transfer: transfer stop ${transferStop.stop_id} is the destination`);
                            continue;
                        }
                        
                        const destRoutesQuery = `
                            SELECT DISTINCT
                                r.route_id,
                                r.route_short_name,
                                r.route_long_name,
                                r.route_type,
                                t.trip_id,
                                t.trip_headsign
                            FROM gtfs.routes_${destCategoryTable} r
                            JOIN gtfs.trips_${destCategoryTable} t ON r.route_id = t.route_id
                            JOIN gtfs.stop_times_${destCategoryTable} st_transfer ON t.trip_id = st_transfer.trip_id
                            JOIN gtfs.stop_times_${destCategoryTable} st_dest ON t.trip_id = st_dest.trip_id
                            WHERE st_transfer.stop_id = $1
                            AND st_dest.stop_id = $2
                            AND st_transfer.stop_sequence < st_dest.stop_sequence
                            LIMIT 3
                        `;

                        const destRoutes = await client.query(destRoutesQuery, [
                            transferStop.stop_id,
                            destStopId
                        ]);

                        for (const destRoute of destRoutes.rows) {
                            transferRoutes.push({
                                // First leg
                                route1_id: originRoute.route_id,
                                route1_name: originRoute.route_short_name,
                                route1_long_name: originRoute.route_long_name,
                                route1_type: originRoute.route_type,
                                trip1_id: originRoute.trip_id,
                                trip1_headsign: originRoute.trip_headsign,
                                // First leg end stop (where you alight from first route)
                                first_leg_end_stop_id: originRoute.end_stop_id,
                                first_leg_end_stop_name: originRoute.end_stop_name,
                                first_leg_end_stop_lat: originRoute.end_stop_lat,
                                first_leg_end_stop_lon: originRoute.end_stop_lon,
                                // Transfer point (second category start)
                                transfer_stop_id: transferStop.stop_id,
                                transfer_stop_name: transferStop.stop_name,
                                transfer_stop_lat: transferStop.stop_lat,
                                transfer_stop_lon: transferStop.stop_lon,
                                transfer_distance: transferStop.distance_km,
                                transfer_category_from: originCategory,
                                transfer_category_to: destCategory,
                                // Second leg
                                route2_id: destRoute.route_id,
                                route2_name: destRoute.route_short_name,
                                route2_long_name: destRoute.route_long_name,
                                route2_type: destRoute.route_type,
                                trip2_id: destRoute.trip_id,
                                trip2_headsign: destRoute.trip_headsign,
                                type: 'transfer',
                                category: 'mixed'
                            });
                        }
                    }
                }
            }

            return transferRoutes.slice(0, 3); // Return top 3 transfer options for speed

        } catch (err) {
            console.error('Error finding transfer routes:', err.message);
            return [];
        }
    }

    /**
     * Get detailed stop information
     */
    async getStopDetails(stopId, category) {
        const client = await pool.connect();
        
        try {
            const categoryTable = category.replace(/-/g, '_');
            
            const query = `
                SELECT 
                    stop_id,
                    stop_code,
                    stop_name,
                    stop_desc,
                    stop_lat,
                    stop_lon,
                    zone_id,
                    location_type,
                    wheelchair_boarding
                FROM gtfs.stops_${categoryTable}
                WHERE stop_id = $1
            `;

            const result = await client.query(query, [stopId]);
            return result.rows[0] || null;

        } finally {
            client.release();
        }
    }

    /**
     * Calculate walking time and directions
     */
    calculateWalkingInfo(fromLat, fromLon, toLat, toLon) {
        const distance = this.calculateDistance(fromLat, fromLon, toLat, toLon);
        const duration = (distance / this.walkingSpeed) * 60; // minutes

        return {
            distance: distance,
            duration: duration,
            instructions: `Walk ${(distance * 1000).toFixed(0)}m (about ${Math.round(duration)} minutes)`
        };
    }

    /**
     * Generate intelligent access options for getting to a stop that's out of walking range
     */
    generateAccessOptions(distanceKm, type, stopName) {
        const isOrigin = type === 'origin';
        const direction = isOrigin ? 'to' : 'from';
        
        // Calculate estimated times and costs for different modes
        const walkingTime = Math.round((distanceKm / this.walkingSpeed) * 60); // minutes
        const cyclingSpeed = 15; // km/h
        const cyclingTime = Math.round((distanceKm / cyclingSpeed) * 60);
        const bikeSharingTime = cyclingTime + 5; // +5 min to find/unlock bike
        const taxiTime = Math.round((distanceKm / 30) * 60) + 3; // 30 km/h avg + 3 min wait
        const grabTime = Math.round((distanceKm / 30) * 60) + 5; // +5 min for booking
        
        // Estimated costs (MYR)
        const taxiCost = Math.max(4, Math.round(4 + (distanceKm * 2))); // Base RM4 + RM2/km
        const grabCost = Math.max(5, Math.round(5 + (distanceKm * 1.8))); // Base RM5 + RM1.8/km
        const bikeSharingCost = 2; // Flat rate
        
        const options = [];
        
        // Walking (if under 5km but over 1.5km)
        if (distanceKm <= 5 && distanceKm > this.maxWalkingDistance) {
            options.push({
                mode: 'walking',
                icon: '🚶',
                name: 'Walk',
                duration: walkingTime,
                cost: 0,
                costDisplay: 'Free',
                distance: distanceKm,
                description: `${walkingTime} min walk ${direction} ${stopName}`,
                carbonEmissions: 0,
                recommendation: distanceKm < 2.5 ? 'Good exercise!' : 'Quite far, consider alternatives'
            });
        }
        
        // Cycling (if under 10km)
        if (distanceKm <= 10) {
            options.push({
                mode: 'cycling',
                icon: '🚴',
                name: 'Cycle (own bike)',
                duration: cyclingTime,
                cost: 0,
                costDisplay: 'Free',
                distance: distanceKm,
                description: `${cyclingTime} min cycle ${direction} ${stopName}`,
                carbonEmissions: 0,
                recommendation: 'Healthy and eco-friendly'
            });
            
            // Bike sharing
            options.push({
                mode: 'bike-sharing',
                icon: '🚲',
                name: 'Bike Sharing (e.g., BEAM, Neuron)',
                duration: bikeSharingTime,
                cost: bikeSharingCost,
                costDisplay: `~RM${bikeSharingCost}`,
                distance: distanceKm,
                description: `${bikeSharingTime} min (incl. finding bike) ${direction} ${stopName}`,
                carbonEmissions: 0,
                recommendation: 'Quick and affordable'
            });
        }
        
        // E-hailing (always available)
        options.push({
            mode: 'grab',
            icon: '🚗',
            name: 'Grab/MyCar',
            duration: grabTime,
            cost: grabCost,
            costDisplay: `~RM${grabCost}`,
            distance: distanceKm,
            description: `${grabTime} min ride ${direction} ${stopName} (incl. booking)`,
            carbonEmissions: distanceKm * 0.171, // kg CO2 for car
            recommendation: distanceKm < 3 ? 'Most convenient option' : 'Fast but adds cost'
        });
        
        // Taxi (always available)
        options.push({
            mode: 'taxi',
            icon: '🚕',
            name: 'Taxi',
            duration: taxiTime,
            cost: taxiCost,
            costDisplay: `~RM${taxiCost}`,
            distance: distanceKm,
            description: `${taxiTime} min ride ${direction} ${stopName}`,
            carbonEmissions: distanceKm * 0.171, // kg CO2 for car
            recommendation: 'Available at stands or by call'
        });
        
        // Sort by a score: prefer low cost, low emissions, reasonable time
        options.sort((a, b) => {
            const scoreA = a.cost + (a.carbonEmissions * 10) + (a.duration / 10);
            const scoreB = b.cost + (b.carbonEmissions * 10) + (b.duration / 10);
            return scoreA - scoreB;
        });
        
        // Generate recommendation text
        const bestOption = options[0];
        let recommendation = `Nearest stop is "${stopName}" (${distanceKm.toFixed(2)}km away). `;
        
        if (bestOption.cost === 0) {
            recommendation += `Recommended: ${bestOption.icon} ${bestOption.name} (${bestOption.duration} min, free, zero emissions)`;
        } else {
            recommendation += `Recommended: ${bestOption.icon} ${bestOption.name} (${bestOption.duration} min, ${bestOption.costDisplay})`;
        }
        
        return {
            distance: distanceKm,
            stopName: stopName,
            type: type,
            options: options,
            bestOption: bestOption,
            recommendation: recommendation
        };
    }

    /**
     * Get shape geometry for a route segment
     */
    async getShapeGeometry(routeId, category, boardStopId, alightStopId) {
        try {
            const categoryTable = category.replace(/-/g, '_');
            console.log(`🗺️  Fetching shape for route ${routeId} [${category}], stops ${boardStopId} → ${alightStopId}`);
            
            // Category-specific logic based on GTFS data quality
            // rapid_bus_mrtfeeder: Has 100% shape_dist_traveled data ✅ (use shapes)
            // rapid_bus_kl: Has shape data but no dist (coordinate matching)
            // rapid_rail_kl: Has shape data but no dist (coordinate matching)
            // ktmb: No shape data at all ❌
            
            if (category === 'ktmb') {
                console.log(`  ⚠️  Skipping shape geometry for KTMB (no shape data available)`);
                return null; // Use straight lines instead
            }
            
            // Get the trip with shape_id and shape_dist_traveled for both stops (GTFS standard approach)
            const tripQuery = await pool.query(`
                SELECT DISTINCT 
                    t.trip_id,
                    t.shape_id,
                    st_board.stop_sequence as board_sequence,
                    st_alight.stop_sequence as alight_sequence,
                    st_board.shape_dist_traveled as board_shape_dist,
                    st_alight.shape_dist_traveled as alight_shape_dist,
                    (st_alight.stop_sequence - st_board.stop_sequence) as sequence_diff
                FROM gtfs.trips_${categoryTable} t
                JOIN gtfs.stop_times_${categoryTable} st_board ON t.trip_id = st_board.trip_id
                JOIN gtfs.stop_times_${categoryTable} st_alight ON t.trip_id = st_alight.trip_id
                WHERE t.route_id = $1
                  AND st_board.stop_id = $2
                  AND st_alight.stop_id = $3
                  AND st_board.stop_sequence < st_alight.stop_sequence
                ORDER BY sequence_diff ASC
                LIMIT 1
            `, [routeId, boardStopId, alightStopId]);
            
            if (tripQuery.rows.length === 0) {
                console.log(`⚠️  No trip found for route ${routeId} between stops`);
                return null;
            }
            
            const trip = tripQuery.rows[0];
            const shapeId = trip.shape_id;
            
            if (!shapeId) {
                console.log(`⚠️  No shape_id found for route ${routeId}`);
                return null;
            }
            
            console.log(`  Found trip: ${trip.trip_id}, shape: ${shapeId}, stops seq ${trip.board_sequence} → ${trip.alight_sequence}`);
            console.log(`  Board stop shape_dist: ${trip.board_shape_dist}, Alight stop shape_dist: ${trip.alight_shape_dist}`);
            
            // Get all shape points for this shape with shape_dist_traveled
            const shapeQuery = await pool.query(`
                SELECT shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled
                FROM gtfs.shapes_${categoryTable}
                WHERE shape_id = $1
                ORDER BY shape_pt_sequence ASC
            `, [shapeId]);
            
            if (shapeQuery.rows.length === 0) {
                console.log(`⚠️  No shape points found for shape_id ${shapeId}`);
                return null;
            }
            
            console.log(`  Total shape points in database: ${shapeQuery.rows.length}`);
            
            // Try to use shape_dist_traveled if available (GTFS best practice)
            const boardShapeDist = parseFloat(trip.board_shape_dist);
            const alightShapeDist = parseFloat(trip.alight_shape_dist);
            
            let boardSeq = 0;
            let alightSeq = shapeQuery.rows.length - 1;
            
            // Always use stop sequence-based matching (similar to rail) for all categories
            // This is more reliable than shape_dist_traveled for bus routes
            console.log(`  Using stop sequence-based matching for reliable segment extraction`);
            
            // Get ALL stops in this segment with their coordinates
            const allStopsQuery = await pool.query(`
                SELECT st.stop_id, st.stop_sequence, s.stop_lat, s.stop_lon
                FROM gtfs.stop_times_${categoryTable} st
                JOIN gtfs.stops_${categoryTable} s ON st.stop_id = s.stop_id
                WHERE st.trip_id = $1
                  AND st.stop_sequence >= $2
                  AND st.stop_sequence <= $3
                ORDER BY st.stop_sequence ASC
            `, [trip.trip_id, trip.board_sequence, trip.alight_sequence]);
            
            if (allStopsQuery.rows.length < 2) {
                console.log(`⚠️  Could not find intermediate stops (need at least 2, found ${allStopsQuery.rows.length})`);
                return null;
            }
            
            console.log(`  Matching ${allStopsQuery.rows.length} stops sequentially in shape data (${shapeQuery.rows.length} shape points)`);
            
            // Match each stop to closest shape point, constrained to appear AFTER previous match
            const matchedIndices = [];
            let searchStartIdx = 0;
            
            for (const stop of allStopsQuery.rows) {
                const stopLat = parseFloat(stop.stop_lat);
                const stopLon = parseFloat(stop.stop_lon);
                
                let minDist = Infinity;
                let bestIdx = searchStartIdx;
                
                // Search from last matched position onwards
                for (let i = searchStartIdx; i < shapeQuery.rows.length; i++) {
                    const shapeLat = parseFloat(shapeQuery.rows[i].shape_pt_lat);
                    const shapeLon = parseFloat(shapeQuery.rows[i].shape_pt_lon);
                    
                    // Haversine distance approximation (in degrees)
                    const dist = Math.sqrt(
                        Math.pow(shapeLat - stopLat, 2) + 
                        Math.pow(shapeLon - stopLon, 2)
                    );
                    
                    if (dist < minDist) {
                        minDist = dist;
                        bestIdx = i;
                    }
                    
                    // Stop searching if distance starts increasing significantly (found closest point)
                    if (minDist < 0.001 && dist > minDist * 2) break;
                }
                
                matchedIndices.push(bestIdx);
                const distKm = minDist * 111; // Convert to approximate km
                searchStartIdx = bestIdx + 1; // Next stop must appear after this one
                console.log(`    Stop ${stop.stop_id} (seq ${stop.stop_sequence}) → shape point ${bestIdx} (${distKm.toFixed(3)} km away)`);
            }
            
            // Use first and last matched indices as segment bounds
            boardSeq = matchedIndices[0];
            alightSeq = matchedIndices[matchedIndices.length - 1];
            
            console.log(`  ✅ Stop sequence matched segment: shape points ${boardSeq} → ${alightSeq} (${matchedIndices.length} stops matched)`)
            
            // Validate the segment
            console.log(`  Final segment indices: boardSeq=${boardSeq}, alightSeq=${alightSeq}`);
            
            if (boardSeq >= alightSeq) {
                console.log(`  ⚠️  Invalid segment: boardSeq (${boardSeq}) >= alightSeq (${alightSeq})`);
                return null;  // Fall back to straight line
            }
            
            if (boardSeq < 0 || alightSeq >= shapeQuery.rows.length) {
                console.log(`  ⚠️  Indices out of bounds: boardSeq=${boardSeq}, alightSeq=${alightSeq}, total=${shapeQuery.rows.length}`);
                return null;  // Fall back to straight line
            }
            
            const segmentSize = alightSeq - boardSeq + 1;
            const totalPoints = shapeQuery.rows.length;
            const segmentPercent = (segmentSize / totalPoints) * 100;
            const stopCount = trip.alight_sequence - trip.board_sequence;
            
            console.log(`  Segment size: ${segmentSize} points (${segmentPercent.toFixed(1)}% of total ${totalPoints})`);
            console.log(`  Stop sequence difference: ${stopCount} stops`);
            
            // Warn if segment is suspiciously large (>80% of total route)
            if (segmentPercent > 80) {
                console.log(`  ⚠️  WARNING: Segment is ${segmentPercent.toFixed(1)}% of total route - this may be drawing too much!`);
            }
            
            // Extract shape points for this segment
            const segmentPoints = shapeQuery.rows.slice(boardSeq, alightSeq + 1);
            console.log(`  ✅ Extracted ${segmentPoints.length} shape points for segment (from ${totalPoints} total)`);
            
            // Minimum validation
            if (segmentPoints.length < 2) {
                console.log(`  ⚠️  Insufficient shape points (${segmentPoints.length}), using straight line`);
                return null;
            }
            
            // Convert to coordinate array
            const coordinates = segmentPoints.map(row => [
                parseFloat(row.shape_pt_lat),
                parseFloat(row.shape_pt_lon)
            ]);
            
            // Snap first and last points to actual stop coordinates for better visual connection
            // Get stop coordinates
            const boardStopQuery = await pool.query(
                `SELECT stop_lat, stop_lon FROM gtfs.stops_${categoryTable} WHERE stop_id = $1`,
                [boardStopId]
            );
            const alightStopQuery = await pool.query(
                `SELECT stop_lat, stop_lon FROM gtfs.stops_${categoryTable} WHERE stop_id = $1`,
                [alightStopId]
            );
            
            const originalFirst = [...coordinates[0]];
            const originalLast = [...coordinates[coordinates.length - 1]];
            
            let boardStopLat, boardStopLon, alightStopLat, alightStopLon;
            
            if (boardStopQuery.rows.length > 0) {
                boardStopLat = parseFloat(boardStopQuery.rows[0].stop_lat);
                boardStopLon = parseFloat(boardStopQuery.rows[0].stop_lon);
                
                // Calculate distance between shape point and actual stop
                const distStart = Math.sqrt(
                    Math.pow((originalFirst[0] - boardStopLat) * 111, 2) + 
                    Math.pow((originalFirst[1] - boardStopLon) * 111, 2)
                );
                
                console.log(`  Start point distance from boardStop: ${distStart.toFixed(2)} km`);
                
                // If shape point is too far from stop (>1km), segment might be wrong
                if (distStart > 1.0) {
                    console.log(`  ⚠️  WARNING: Shape segment start is ${distStart.toFixed(2)}km from board stop - segment might be incorrect!`);
                    console.log(`  Falling back to straight line for safety`);
                    return null;  // Use straight line instead
                }
                
                coordinates[0] = [boardStopLat, boardStopLon];
                console.log(`  ✓ Snapped start: [${originalFirst[0].toFixed(5)}, ${originalFirst[1].toFixed(5)}] → [${coordinates[0][0].toFixed(5)}, ${coordinates[0][1].toFixed(5)}]`);
            }
            
            if (alightStopQuery.rows.length > 0) {
                alightStopLat = parseFloat(alightStopQuery.rows[0].stop_lat);
                alightStopLon = parseFloat(alightStopQuery.rows[0].stop_lon);
                
                // Calculate distance between shape point and actual stop
                const distEnd = Math.sqrt(
                    Math.pow((originalLast[0] - alightStopLat) * 111, 2) + 
                    Math.pow((originalLast[1] - alightStopLon) * 111, 2)
                );
                
                console.log(`  End point distance from alightStop: ${distEnd.toFixed(2)} km`);
                
                // If shape point is too far from stop (>1km), segment might be wrong
                if (distEnd > 1.0) {
                    console.log(`  ⚠️  WARNING: Shape segment end is ${distEnd.toFixed(2)}km from alight stop - segment might be incorrect!`);
                    console.log(`  Falling back to straight line for safety`);
                    return null;  // Use straight line instead
                }
                
                coordinates[coordinates.length - 1] = [alightStopLat, alightStopLon];
                console.log(`  ✓ Snapped end: [${originalLast[0].toFixed(5)}, ${originalLast[1].toFixed(5)}] → [${coordinates[coordinates.length - 1][0].toFixed(5)}, ${coordinates[coordinates.length - 1][1].toFixed(5)}]`);
            }
            
            // Encode as polyline
            const encoded = this.encodePolyline(coordinates);
            console.log(`  ✓ Encoded segment polyline length: ${encoded.length} chars`);
            return encoded;
            
        } catch (error) {
            console.error('❌ Error fetching shape geometry:', error);
            return null;
        }
    }
    
    /**
     * Encode coordinates as polyline
     */
    encodePolyline(coordinates) {
        let encoded = '';
        let prevLat = 0;
        let prevLng = 0;
        
        for (const [lat, lng] of coordinates) {
            const lat5 = Math.round(lat * 1e5);
            const lng5 = Math.round(lng * 1e5);
            
            encoded += this.encodeNumber(lat5 - prevLat);
            encoded += this.encodeNumber(lng5 - prevLng);
            
            prevLat = lat5;
            prevLng = lng5;
        }
        
        return encoded;
    }
    
    /**
     * Encode a single number for polyline
     */
    encodeNumber(num) {
        let encoded = '';
        let value = num < 0 ? ~(num << 1) : (num << 1);
        
        while (value >= 0x20) {
            encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
            value >>= 5;
        }
        
        encoded += String.fromCharCode(value + 63);
        return encoded;
    }

    /**
     * Plan transit route with step-by-step directions
     */
    async planTransitRoute(originLat, originLon, destLat, destLon) {
        try {
            console.log(`Planning transit route from [${originLat},${originLon}] to [${destLat},${destLon}]`);
            
            // 1. CHECK CACHE FIRST ⚡
            const cached = await routeCacheService.get(originLat, originLon, destLat, destLon, 'transit');
            if (cached) {
                return cached;  // Cache hit! Return immediately (much faster)
            }

            // Step 1: Find nearby stops at origin (search all categories: bus, MRT feeder, rail)
            let originStops = await this.findNearbyStops(originLat, originLon, this.maxWalkingDistance, 20);
            
            // If no stops within walking distance, find nearest stops anyway (up to 5km)
            if (originStops.length === 0) {
                originStops = await this.findNearbyStops(originLat, originLon, 5.0, 20);
                
                if (originStops.length === 0) {
                    return {
                        success: false,
                        error: 'No public transport stops found near origin',
                        suggestion: 'This area is not serviced by public transport'
                    };
                }
                
                // Return with info about nearest stops (too far to walk)
                const nearestStop = originStops[0];
                const accessOptions = this.generateAccessOptions(nearestStop.distance_km, 'origin', nearestStop.stop_name);
                
                return {
                    success: false,
                    error: `No stops within walking distance of origin (${this.maxWalkingDistance}km)`,
                    nearestOriginStops: originStops.map(stop => ({
                        name: stop.stop_name,
                        stopId: stop.stop_id,
                        distance: stop.distance_km,
                        category: stop.category,
                        location: {
                            latitude: stop.stop_lat,
                            longitude: stop.stop_lon
                        }
                    })),
                    accessOptions: accessOptions,
                    suggestion: accessOptions.recommendation
                };
            }

            // Step 2: Find nearby stops at destination (search all categories: bus, MRT feeder, rail)
            let destStops = await this.findNearbyStops(destLat, destLon, this.maxWalkingDistance, 20);
            
            // If no stops within walking distance, find nearest stops anyway (up to 5km)
            if (destStops.length === 0) {
                destStops = await this.findNearbyStops(destLat, destLon, 5.0, 20);
                
                if (destStops.length === 0) {
                    return {
                        success: false,
                        error: 'No public transport stops found near destination',
                        suggestion: 'This area is not serviced by public transport'
                    };
                }
                
                // Return with info about nearest stops (too far to walk)
                const nearestDestStop = destStops[0];
                const destAccessOptions = this.generateAccessOptions(nearestDestStop.distance_km, 'destination', nearestDestStop.stop_name);
                
                return {
                    success: false,
                    error: `No stops within walking distance of destination (${this.maxWalkingDistance}km)`,
                    nearestDestStops: destStops.map(stop => ({
                        name: stop.stop_name,
                        stopId: stop.stop_id,
                        distance: stop.distance_km,
                        category: stop.category,
                        location: {
                            latitude: stop.stop_lat,
                            longitude: stop.stop_lon
                        }
                    })),
                    accessOptions: destAccessOptions,
                    suggestion: destAccessOptions.recommendation
                };
            }

            // Step 3: Find routes between stops
            const routeOptions = [];
            
            // Calculate straight-line distance between origin and destination
            const directDistance = this.calculateDistance(originLat, originLon, destLat, destLon);
            console.log(`  📏 Direct distance: ${directDistance.toFixed(2)}km`);
            
            // Distance-based stop prioritization:
            // - Short trips (< 5km): Don't prioritize rail, allow buses (faster, more direct)
            // - Long trips (>= 5km): Prioritize rail (faster for longer distances)
            const shouldPrioritizeRail = directDistance >= 5.0;
            
            const prioritizeStops = (stops) => {
                if (!shouldPrioritizeRail) {
                    // Short trip: Sort by proximity only (buses might be better)
                    console.log(`  🚌 Short trip detected: Including buses alongside rail`);
                    return stops; // Keep original distance-based order
                } else {
                    // Long trip: Prioritize rail stations (they're faster for long distances)
                    console.log(`  🚇 Long trip detected: Prioritizing rail stations`);
                    const actualRailStops = stops.filter(s => 
                        s.category === 'rapid-rail-kl' || s.category === 'ktmb'
                    );
                    const otherStops = stops.filter(s => 
                        s.category !== 'rapid-rail-kl' && s.category !== 'ktmb'
                    );
                    return [...actualRailStops, ...otherStops];
                }
            };
            
            // Limit to top 3 stops for faster performance (especially on serverless)
            // 3×3 = 9 combinations max (vs 4×4 = 16)
            const prioritizedOriginStops = prioritizeStops(originStops).slice(0, 3);
            const prioritizedDestStops = prioritizeStops(destStops).slice(0, 3);
            
            // Reduced limit for faster serverless performance
            let checkedCombinations = 0;
            const maxCombinations = 9; // 3 origin × 3 dest = faster route finding

            outerLoop: for (const originStop of prioritizedOriginStops) {
                for (const destStop of prioritizedDestStops) {
                    // Early exit if we have enough routes already (reduced for speed)
                    if (routeOptions.length >= 3) {
                        console.log('⚡ Early exit: Found sufficient routes (3+)');
                        break outerLoop;
                    }
                    
                    checkedCombinations++;
                    if (checkedCombinations > maxCombinations) {
                        console.log('⚡ Early exit: Max combinations checked');
                        break outerLoop;
                    }
                    
                    console.log(`  Checking: ${originStop.stop_name} (${originStop.category}) → ${destStop.stop_name} (${destStop.category})`);
                    
                    const connections = await this.findConnectingRoutes(
                        originStop.stop_id,
                        destStop.stop_id,
                        originStop.category,
                        destStop.category
                    );
                    
                    console.log(`    Found: ${connections.direct.length} direct, ${connections.transfers.length} transfers`);
                    
                    // If we found direct routes, prioritize them and skip other combinations
                    if (connections.direct.length > 0 && routeOptions.filter(r => r.type === 'direct').length === 0) {
                        console.log('⚡ Found direct routes, processing them first');
                    }

                    // Process direct routes (limit to first 2 for speed)
                    for (const route of connections.direct.slice(0, 2)) {
                        const walkToStop = this.calculateWalkingInfo(
                            originLat, originLon,
                            originStop.stop_lat, originStop.stop_lon
                        );

                        const walkFromStop = this.calculateWalkingInfo(
                            destStop.stop_lat, destStop.stop_lon,
                            destLat, destLon
                        );

                        // Skip if board and alight stops are the same
                        if (originStop.stop_id === destStop.stop_id) {
                            console.log(`⚠️  Skipping invalid direct route: board and alight at same stop (${originStop.stop_name})`);
                            continue;
                        }

                        // Estimate transit distance
                        const transitDistance = this.calculateDistance(
                            originStop.stop_lat, originStop.stop_lon,
                            destStop.stop_lat, destStop.stop_lon
                        );

                        // Calculate emissions
                        const routeType = this.getRouteTypeFromGTFS(route.route_type);
                        const emissionFactor = this.emissionFactors[routeType] || this.emissionFactors.bus;
                        const totalEmissions = transitDistance * emissionFactor;

                        // Estimate transit duration (assuming 30 km/h average for buses, 50 km/h for trains)
                        const avgSpeed = routeType === 'bus' ? 30 : 50;
                        const transitDuration = (transitDistance / avgSpeed) * 60;

                        const totalDuration = walkToStop.duration + transitDuration + walkFromStop.duration;

                        // Get shape geometry for the transit segment
                        const shapeGeometry = await this.getShapeGeometry(
                            route.route_id,
                            originStop.category,
                            originStop.stop_id,
                            destStop.stop_id
                        );

                        routeOptions.push({
                            type: 'direct',
                            totalDistance: walkToStop.distance + transitDistance + walkFromStop.distance,
                            totalDuration: totalDuration,
                            totalEmissions: totalEmissions,
                            emissionFactor: emissionFactor,
                            steps: [
                                {
                                    type: 'walk',
                                    instruction: `Walk to ${originStop.stop_name}`,
                                    distance: walkToStop.distance,
                                    duration: walkToStop.duration,
                                    from: { latitude: originLat, longitude: originLon },
                                    to: {
                                        latitude: originStop.stop_lat,
                                        longitude: originStop.stop_lon,
                                        name: originStop.stop_name,
                                        stopId: originStop.stop_id
                                    },
                                    geometry: await this.getWalkingGeometry(originLat, originLon, originStop.stop_lat, originStop.stop_lon)
                                },
                                {
                                    type: 'transit',
                                    mode: routeType,
                                    instruction: `Take ${route.route_short_name || route.route_long_name} towards ${route.trip_headsign || 'destination'}`,
                                    routeId: route.route_id,
                                    routeName: route.route_short_name,
                                    routeLongName: route.route_long_name,
                                    headsign: route.trip_headsign,
                                    boardStop: {
                                        stopId: originStop.stop_id,
                                        name: originStop.stop_name,
                                        latitude: originStop.stop_lat,
                                        longitude: originStop.stop_lon
                                    },
                                    alightStop: {
                                        stopId: destStop.stop_id,
                                        name: destStop.stop_name,
                                        latitude: destStop.stop_lat,
                                        longitude: destStop.stop_lon
                                    },
                                    distance: transitDistance,
                                    duration: transitDuration,
                                    emissions: totalEmissions,
                                    category: originStop.category,
                                    geometry: shapeGeometry  // Add shape geometry
                                },
                                {
                                    type: 'walk',
                                    instruction: `Walk to destination from ${destStop.stop_name}`,
                                    distance: walkFromStop.distance,
                                    duration: walkFromStop.duration,
                                    from: {
                                        latitude: destStop.stop_lat,
                                        longitude: destStop.stop_lon,
                                        name: destStop.stop_name
                                    },
                                    to: { latitude: destLat, longitude: destLon },
                                    geometry: await this.getWalkingGeometry(destStop.stop_lat, destStop.stop_lon, destLat, destLon)
                                }
                            ],
                            category: originStop.category
                        });
                    }

                    // Process transfer routes only if needed
                    const directRouteCount = routeOptions.filter(r => r.type === 'direct').length;
                    
                    // Skip transfers if we have 2+ direct routes already
                    if (directRouteCount >= 2) {
                        console.log('⚡ Skipping transfers: Already have direct routes');
                        continue;
                    }
                    
                    // Limit transfers processed
                    const transfersToProcess = connections.transfers.slice(0, 1); // Only process 1 transfer
                    
                    for (const route of transfersToProcess) {
                        // Early exit
                        if (routeOptions.length >= 5) break;
                        // First leg
                        const firstLegOriginStop = await this.getStopDetails(originStop.stop_id, originStop.category);
                        const transferStop = {
                            stop_id: route.transfer_stop_id,
                            stop_name: route.transfer_stop_name,
                            stop_lat: route.transfer_stop_lat,
                            stop_lon: route.transfer_stop_lon
                        };

                        // Walking segments
                        const walkToOriginStop = this.calculateWalkingInfo(
                            originLat, originLon,
                            originStop.stop_lat, originStop.stop_lon
                        );

                        const firstLegDistance = this.calculateDistance(
                            originStop.stop_lat, originStop.stop_lon,
                            transferStop.stop_lat, transferStop.stop_lon
                        );

                        const route1Type = this.getRouteTypeFromGTFS(route.route1_type);
                        const avgSpeed1 = route1Type === 'bus' ? 30 : 50;
                        const firstLegDuration = (firstLegDistance / avgSpeed1) * 60;
                        const firstLegEmissions = firstLegDistance * (this.emissionFactors[route1Type] || this.emissionFactors.bus);

                        // Transfer walking (if different categories)
                        let transferWalk = null;
                        if (route.category === 'mixed' && route.transfer_distance) {
                            transferWalk = {
                                distance: route.transfer_distance,
                                duration: (route.transfer_distance / this.walkingSpeed) * 60
                            };
                        }

                        // Second leg
                        const secondLegDistance = this.calculateDistance(
                            transferStop.stop_lat, transferStop.stop_lon,
                            destStop.stop_lat, destStop.stop_lon
                        );

                        const route2Type = this.getRouteTypeFromGTFS(route.route2_type);
                        const avgSpeed2 = route2Type === 'bus' ? 30 : 50;
                        const secondLegDuration = (secondLegDistance / avgSpeed2) * 60;
                        const secondLegEmissions = secondLegDistance * (this.emissionFactors[route2Type] || this.emissionFactors.bus);

                        const walkFromDestStop = this.calculateWalkingInfo(
                            destStop.stop_lat, destStop.stop_lon,
                            destLat, destLon
                        );

                        const totalEmissions = firstLegEmissions + secondLegEmissions;
                        const totalDuration = walkToOriginStop.duration + firstLegDuration + 
                                            (transferWalk ? transferWalk.duration + 5 : 3) + // Transfer time
                                            secondLegDuration + walkFromDestStop.duration;
                        const totalDistance = Number(walkToOriginStop.distance) + Number(firstLegDistance) + 
                                            (transferWalk ? Number(transferWalk.distance) : 0) +
                                            Number(secondLegDistance) + Number(walkFromDestStop.distance);

                        // Validate: Skip if first leg has same board/alight stop
                        const firstLegEndStopId = route.category === 'mixed' ? route.first_leg_end_stop_id : route.transfer_stop_id;
                        if (originStop.stop_id === firstLegEndStopId) {
                            console.log(`⚠️  Skipping invalid transfer route: first leg boards and alights at same stop (${originStop.stop_name})`);
                            continue;
                        }
                        
                        // Validate: Skip if second leg has same board/alight stop
                        if (route.transfer_stop_id === destStop.stop_id) {
                            console.log(`⚠️  Skipping invalid transfer route: second leg boards and alights at same stop (${route.transfer_stop_name})`);
                            continue;
                        }

                        // Get shape geometries for both legs
                        // For mixed-category transfers, use the first_leg_end_stop_id (where you alight from first route)
                        const firstLegGeometry = await this.getShapeGeometry(
                            route.route1_id,
                            originStop.category,
                            originStop.stop_id,
                            firstLegEndStopId
                        );
                        
                        const secondLegGeometry = await this.getShapeGeometry(
                            route.route2_id,
                            destStop.category,
                            route.transfer_stop_id,
                            destStop.stop_id
                        );

                        // Build steps array
                        const steps = [
                            {
                                type: 'walk',
                                instruction: `Walk to ${originStop.stop_name}`,
                                distance: walkToOriginStop.distance,
                                duration: walkToOriginStop.duration,
                                from: { latitude: originLat, longitude: originLon },
                                to: {
                                    latitude: originStop.stop_lat,
                                    longitude: originStop.stop_lon,
                                    name: originStop.stop_name,
                                    stopId: originStop.stop_id
                                },
                                geometry: await this.getWalkingGeometry(originLat, originLon, originStop.stop_lat, originStop.stop_lon)
                            },
                            {
                                type: 'transit',
                                mode: route1Type,
                                instruction: `Take ${route.route1_name || route.route1_long_name} towards ${route.trip1_headsign || 'transfer point'}`,
                                routeId: route.route1_id,
                                routeName: route.route1_name,
                                routeLongName: route.route1_long_name,
                                headsign: route.trip1_headsign,
                                boardStop: {
                                    stopId: originStop.stop_id,
                                    name: originStop.stop_name,
                                    latitude: originStop.stop_lat,
                                    longitude: originStop.stop_lon
                                },
                                alightStop: route.category === 'mixed' ? {
                                    stopId: route.first_leg_end_stop_id,
                                    name: route.first_leg_end_stop_name,
                                    latitude: route.first_leg_end_stop_lat,
                                    longitude: route.first_leg_end_stop_lon
                                } : {
                                    stopId: route.transfer_stop_id,
                                    name: route.transfer_stop_name,
                                    latitude: route.transfer_stop_lat,
                                    longitude: route.transfer_stop_lon
                                },
                                distance: firstLegDistance,
                                duration: firstLegDuration,
                                emissions: firstLegEmissions,
                                category: originStop.category,
                                geometry: firstLegGeometry  // Add first leg geometry
                            }
                        ];

                        // Add transfer walk if needed
                        if (transferWalk) {
                            const fromName = this.getCategoryFriendlyName(route.transfer_category_from);
                            const toName = this.getCategoryFriendlyName(route.transfer_category_to);
                            steps.push({
                                type: 'transfer',
                                instruction: `Walk to connecting stop (transfer from ${fromName} to ${toName})`,
                                distance: transferWalk.distance,
                                duration: transferWalk.duration + 5, // Add 5 min buffer
                                from: {
                                    latitude: route.first_leg_end_stop_lat,
                                    longitude: route.first_leg_end_stop_lon,
                                    name: route.first_leg_end_stop_name
                                },
                                to: {
                                    latitude: route.transfer_stop_lat,
                                    longitude: route.transfer_stop_lon,
                                    name: route.transfer_stop_name
                                },
                                geometry: await this.getWalkingGeometry(
                                    route.first_leg_end_stop_lat,
                                    route.first_leg_end_stop_lon,
                                    route.transfer_stop_lat,
                                    route.transfer_stop_lon
                                )
                            });
                        } else {
                            steps.push({
                                type: 'transfer',
                                instruction: `Transfer at ${route.transfer_stop_name}`,
                                distance: 0,
                                duration: 3, // 3 min transfer time
                                transferPoint: {
                                    latitude: route.transfer_stop_lat,
                                    longitude: route.transfer_stop_lon,
                                    name: route.transfer_stop_name,
                                    stopId: route.transfer_stop_id
                                }
                            });
                        }

                        // Second transit leg
                        steps.push({
                            type: 'transit',
                            mode: route2Type,
                            instruction: `Take ${route.route2_name || route.route2_long_name} towards ${route.trip2_headsign || 'destination'}`,
                            routeId: route.route2_id,
                            routeName: route.route2_name,
                            routeLongName: route.route2_long_name,
                            headsign: route.trip2_headsign,
                            boardStop: {
                                stopId: route.transfer_stop_id,
                                name: route.transfer_stop_name,
                                latitude: route.transfer_stop_lat,
                                longitude: route.transfer_stop_lon
                            },
                            alightStop: {
                                stopId: destStop.stop_id,
                                name: destStop.stop_name,
                                latitude: destStop.stop_lat,
                                longitude: destStop.stop_lon
                            },
                            distance: secondLegDistance,
                            duration: secondLegDuration,
                            emissions: secondLegEmissions,
                            category: route.category === 'mixed' ? route.transfer_category_to : originStop.category,
                            geometry: secondLegGeometry  // Add second leg geometry
                        });

                        // Final walk
                        steps.push({
                            type: 'walk',
                            instruction: `Walk to destination from ${destStop.stop_name}`,
                            distance: walkFromDestStop.distance,
                            duration: walkFromDestStop.duration,
                            from: {
                                latitude: destStop.stop_lat,
                                longitude: destStop.stop_lon,
                                name: destStop.stop_name
                            },
                            to: { latitude: destLat, longitude: destLon },
                            geometry: await this.getWalkingGeometry(destStop.stop_lat, destStop.stop_lon, destLat, destLon)
                        });

                        routeOptions.push({
                            type: 'transfer',
                            totalDistance: totalDistance,
                            totalDuration: totalDuration,
                            totalEmissions: totalEmissions,
                            transferPoint: route.transfer_stop_name,
                            steps: steps,
                            category: route.category
                        });
                    }
                }
            }

            if (routeOptions.length === 0) {
                return {
                    success: false,
                    error: 'No public transport routes found between these locations',
                    originStops: originStops.slice(0, 10).map(stop => ({
                        name: stop.stop_name,
                        stopId: stop.stop_id,
                        distance: stop.distance_km,
                        category: stop.category,
                        location: {
                            latitude: stop.stop_lat,
                            longitude: stop.stop_lon
                        }
                    })),
                    destStops: destStops.slice(0, 10).map(stop => ({
                        name: stop.stop_name,
                        stopId: stop.stop_id,
                        distance: stop.distance_km,
                        category: stop.category,
                        location: {
                            latitude: stop.stop_lat,
                            longitude: stop.stop_lon
                        }
                    })),
                    suggestion: 'The locations may not be well connected by public transport'
                };
            }

            // Sort by total duration, but prefer direct routes over transfers if similar duration
            routeOptions.sort((a, b) => {
                // If both are same type, sort by duration
                if (a.type === b.type) {
                    return a.totalDuration - b.totalDuration;
                }
                // If durations are similar (within 10 min), prefer direct
                if (Math.abs(a.totalDuration - b.totalDuration) < 10) {
                    return a.type === 'direct' ? -1 : 1;
                }
                // Otherwise sort by duration
                return a.totalDuration - b.totalDuration;
            });

            // Separate direct and transfer routes
            const directRoutes = routeOptions.filter(r => r.type === 'direct');
            const transferRoutes = routeOptions.filter(r => r.type === 'transfer');

            // Filter out unnecessary transfers when direct routes are faster
            let filteredRoutes = [...routeOptions];
            if (directRoutes.length > 0) {
                const fastestDirectDuration = directRoutes[0].totalDuration;
                // Remove transfers that are slower than the fastest direct route
                filteredRoutes = routeOptions.filter(route => {
                    if (route.type === 'direct') return true;
                    // Only keep transfers if they're at least 5 minutes faster or have fewer steps
                    const isFaster = route.totalDuration < fastestDirectDuration - 5;
                    const hasFewerSteps = route.steps.length < directRoutes[0].steps.length;
                    if (!isFaster && !hasFewerSteps) {
                        console.log(`⚠️  Filtering out slower ${route.routeName} (${route.type}): ${route.totalDuration.toFixed(1)}min vs ${fastestDirectDuration.toFixed(1)}min direct`);
                        return false;
                    }
                    return true;
                });
            }

            // Deduplicate routes based on route name and stops
            const uniqueRoutes = [];
            const seen = new Set();
            
            for (const route of filteredRoutes) {
                // Create unique key based on route details
                const transitStep = route.steps.find(s => s.type === 'transit');
                if (transitStep) {
                    const key = `${transitStep.routeId}-${transitStep.boardStop.stopId}-${transitStep.alightStop.stopId}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueRoutes.push(route);
                    } else {
                        console.log(`⚠️  Removing duplicate route: ${transitStep.routeName}`);
                    }
                } else {
                    uniqueRoutes.push(route);
                }
            }
            
            // Limit to top 3 routes (provide multiple options for user choice)
            const topRoutes = uniqueRoutes.slice(0, 3);

            const result = {
                success: true,
                origin: { latitude: originLat, longitude: originLon },
                destination: { latitude: destLat, longitude: destLon },
                routes: topRoutes, // Only return top 3 unique routes
                directRoutes: topRoutes.filter(r => r.type === 'direct'), // Direct routes that made it through
                transferRoutes: topRoutes.filter(r => r.type === 'transfer'), // Transfers that made it through
                totalRoutesFound: routeOptions.length, // Total routes before filtering
                totalRoutes: topRoutes.length, // Routes after filtering
                bestRoute: topRoutes[0],
                routeTypes: {
                    direct: directRoutes.length, // Total direct routes found
                    transfer: transferRoutes.length, // Total transfer routes found
                    filtered: routeOptions.length - filteredRoutes.length // Number filtered out
                },
                timestamp: new Date().toISOString()
            };
            
            // 2. STORE IN CACHE for next time 💾 (stored as JSON in geometry field)
            await routeCacheService.set(originLat, originLon, destLat, destLon, 'transit', result);
            
            return result;

        } catch (error) {
            console.error('Error planning transit route:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Convert category to user-friendly name
     */
    getCategoryFriendlyName(category) {
        const friendlyNames = {
            'rapid-rail-kl': 'MRT/LRT',
            'rapid-bus-kl': 'RapidKL Bus',
            'rapid-bus-mrtfeeder': 'MRT Feeder Bus',
            'ktmb': 'KTM Train',
            'rapid_rail_kl': 'MRT/LRT',
            'rapid_bus_kl': 'RapidKL Bus',
            'rapid_bus_mrtfeeder': 'MRT Feeder Bus'
        };
        return friendlyNames[category] || category;
    }

    /**
     * Convert GTFS route_type to our mode names
     */
    getRouteTypeFromGTFS(routeType) {
        // GTFS route types: 0=Tram, 1=Metro, 2=Rail, 3=Bus, 4=Ferry, etc.
        const typeMap = {
            0: 'lrt',      // Tram/LRT
            1: 'mrt',      // Metro/MRT
            2: 'train',    // Rail
            3: 'bus',      // Bus
            4: 'ferry',    // Ferry
            5: 'train',    // Cable car
            6: 'lrt',      // Gondola
            7: 'monorail'  // Funicular
        };

        return typeMap[routeType] || 'bus';
    }

    /**
     * Get all available routes and stops summary
     */
    async getTransitSystemSummary() {
        const client = await pool.connect();
        
        try {
            const summary = {};

            for (const category of this.categories) {
                try {
                    const categoryTable = category.replace(/_/g, '_');
                    const categoryName = category.replace(/_/g, '-');

                    const stopsQuery = `SELECT COUNT(*) as count FROM gtfs.stops_${categoryTable}`;
                    const routesQuery = `SELECT COUNT(*) as count FROM gtfs.routes_${categoryTable}`;
                    const tripsQuery = `SELECT COUNT(*) as count FROM gtfs.trips_${categoryTable}`;

                    const stopsResult = await client.query(stopsQuery);
                    const routesResult = await client.query(routesQuery);
                    const tripsResult = await client.query(tripsQuery);

                    summary[categoryName] = {
                        stops: parseInt(stopsResult.rows[0].count),
                        routes: parseInt(routesResult.rows[0].count),
                        trips: parseInt(tripsResult.rows[0].count)
                    };
                } catch (err) {
                    console.log(`Category ${category} not available`);
                }
            }

            return summary;

        } finally {
            client.release();
        }
    }
}

export default TransitRoutingService;



