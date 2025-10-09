import { pool } from '../config/database.js';

/**
 * Transit Routing Service using GTFS Data
 * Provides public transport routing with step-by-step directions
 */
class TransitRoutingService {
    constructor() {
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
        this.maxWalkingDistance = 1.5;

        // GTFS categories
        this.categories = ['rapid_bus_kl', 'rapid_bus_mrtfeeder', 'rapid_rail_kl'];
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
     * Find stops near a location across all GTFS categories
     */
    async findNearbyStops(latitude, longitude, radiusKm = 1.5, limit = 10) {
        const client = await pool.connect();
        
        try {
            const allStops = [];

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
                                    cos(radians($1)) * cos(radians(stop_lat)) * 
                                    cos(radians(stop_lon) - radians($2)) + 
                                    sin(radians($1)) * sin(radians(stop_lat))
                                ))::NUMERIC, 3
                            ) as distance_km,
                            $3 as category
                        FROM gtfs.stops_${category}
                        WHERE 6371 * acos(
                            cos(radians($1)) * cos(radians(stop_lat)) * 
                            cos(radians(stop_lon) - radians($2)) + 
                            sin(radians($1)) * sin(radians(stop_lat))
                        ) <= $4
                        ORDER BY distance_km
                        LIMIT $5
                    `;

                    const result = await client.query(query, [
                        latitude,
                        longitude,
                        category.replace(/_/g, '-'),
                        radiusKm,
                        limit
                    ]);

                    allStops.push(...result.rows);
                } catch (err) {
                    console.log(`Category ${category} not available:`, err.message);
                }
            }

            // Sort by distance and limit
            allStops.sort((a, b) => a.distance_km - b.distance_km);
            return allStops.slice(0, limit);

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
                                    cos(radians($1)) * cos(radians(s.stop_lat)) * 
                                    cos(radians(s.stop_lon) - radians($2)) + 
                                    sin(radians($1)) * sin(radians(s.stop_lat))
                                ))::NUMERIC, 3
                            ) as distance_km
                        FROM gtfs.stops_${destCategoryTable} s
                        WHERE 6371 * acos(
                            cos(radians($1)) * cos(radians(s.stop_lat)) * 
                            cos(radians(s.stop_lon) - radians($2)) + 
                            sin(radians($1)) * sin(radians(s.stop_lat))
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
                                // Transfer point
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
     * Plan transit route with step-by-step directions
     */
    async planTransitRoute(originLat, originLon, destLat, destLon) {
        try {
            console.log(`Planning transit route from [${originLat},${originLon}] to [${destLat},${destLon}]`);

            // Step 1: Find nearby stops at origin (reduced from 5 to 3 for speed)
            let originStops = await this.findNearbyStops(originLat, originLon, this.maxWalkingDistance, 3);
            
            // If no stops within walking distance, find nearest stops anyway (up to 5km)
            if (originStops.length === 0) {
                originStops = await this.findNearbyStops(originLat, originLon, 5.0, 5);
                
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

            // Step 2: Find nearby stops at destination (reduced from 5 to 3 for speed)
            let destStops = await this.findNearbyStops(destLat, destLon, this.maxWalkingDistance, 3);
            
            // If no stops within walking distance, find nearest stops anyway (up to 5km)
            if (destStops.length === 0) {
                destStops = await this.findNearbyStops(destLat, destLon, 5.0, 5);
                
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
            
            // Optimize: check only closest stops and break early
            // Check 1-2 stop combinations max
            let checkedCombinations = 0;
            const maxCombinations = 2;

            outerLoop: for (const originStop of originStops.slice(0, 2)) {
                for (const destStop of destStops.slice(0, 2)) {
                    // Early exit if we have enough routes already
                    if (routeOptions.length >= 5) {
                        console.log('⚡ Early exit: Found sufficient routes');
                        break outerLoop;
                    }
                    
                    checkedCombinations++;
                    if (checkedCombinations > maxCombinations) {
                        console.log('⚡ Early exit: Max combinations checked');
                        break outerLoop;
                    }
                    
                    const connections = await this.findConnectingRoutes(
                        originStop.stop_id,
                        destStop.stop_id,
                        originStop.category,
                        destStop.category
                    );
                    
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
                                    }
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
                                    category: originStop.category
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
                                    to: { latitude: destLat, longitude: destLon }
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
                                }
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
                                alightStop: {
                                    stopId: route.transfer_stop_id,
                                    name: route.transfer_stop_name,
                                    latitude: route.transfer_stop_lat,
                                    longitude: route.transfer_stop_lon
                                },
                                distance: firstLegDistance,
                                duration: firstLegDuration,
                                emissions: firstLegEmissions,
                                category: originStop.category
                            }
                        ];

                        // Add transfer walk if needed
                        if (transferWalk) {
                            steps.push({
                                type: 'transfer',
                                instruction: `Walk to connecting stop (transfer from ${route.transfer_category_from} to ${route.transfer_category_to})`,
                                distance: transferWalk.distance,
                                duration: transferWalk.duration + 5, // Add 5 min buffer
                                from: {
                                    latitude: route.transfer_stop_lat,
                                    longitude: route.transfer_stop_lon,
                                    name: route.transfer_stop_name
                                },
                                to: {
                                    latitude: route.transfer_stop_lat,
                                    longitude: route.transfer_stop_lon,
                                    name: route.transfer_stop_name
                                }
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
                            category: route.category === 'mixed' ? route.transfer_category_to : originStop.category
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
                            to: { latitude: destLat, longitude: destLon }
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
                    originStops: originStops.slice(0, 3),
                    destStops: destStops.slice(0, 3),
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

            // Limit to top 3 routes for better performance
            const topRoutes = routeOptions.slice(0, 3);
            
            // Separate direct and transfer routes (from all found routes for stats)
            const directRoutes = routeOptions.filter(r => r.type === 'direct');
            const transferRoutes = routeOptions.filter(r => r.type === 'transfer');

            return {
                success: true,
                origin: { latitude: originLat, longitude: originLon },
                destination: { latitude: destLat, longitude: destLon },
                routes: topRoutes, // Only return top 3
                directRoutes: directRoutes.slice(0, 2), // Max 2 direct alternatives
                transferRoutes: transferRoutes.slice(0, 2), // Max 2 transfer alternatives
                totalRoutesFound: routeOptions.length, // Total routes found
                totalRoutes: topRoutes.length, // Routes returned
                bestRoute: topRoutes[0],
                routeTypes: {
                    direct: directRoutes.length,
                    transfer: transferRoutes.length
                },
                timestamp: new Date().toISOString()
            };

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

