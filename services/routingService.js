import fetch from 'node-fetch';
import { pool } from '../config/database.js';
import { routeCacheService } from './routeCacheService.js';

/**
 * Routing Service for Carbon Emission Comparison
 * Compares carbon emissions across different transport modes and routes
 */
class RoutingService {
    constructor() {
        // Carbon emission factors (kg CO2 per km)
        this.emissionFactors = {
            // Private vehicles
            car_small_petrol: 0.142,
            car_small_diesel: 0.125,
            car_small_hybrid: 0.097,
            car_small_phev: 0.050,
            car_small_bev: 0.000,
            
            car_medium_petrol: 0.192,
            car_medium_diesel: 0.171,
            car_medium_hybrid: 0.121,
            car_medium_phev: 0.067,
            car_medium_bev: 0.000,
            
            car_large_petrol: 0.282,
            car_large_diesel: 0.251,
            car_large_hybrid: 0.178,
            car_large_phev: 0.103,
            car_large_bev: 0.000,
            
            // Motorcycles
            motorcycle_small: 0.084,
            motorcycle_medium: 0.103,
            motorcycle_large: 0.134,
            
            // Public transport
            bus: 0.089,
            mrt: 0.023,
            lrt: 0.023,
            monorail: 0.023,
            train: 0.041,
            
            // Active transport
            bicycle: 0.000,
            walking: 0.000
        };
    }

    /**
     * Calculate straight-line distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
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
     * Calculate carbon emissions for a route
     */
    calculateEmissions(distance, mode, size = 'medium', fuelType = 'petrol') {
        let factor = 0;
        
        if (mode === 'car') {
            const key = `car_${size}_${fuelType}`;
            factor = this.emissionFactors[key] || this.emissionFactors.car_medium_petrol;
        } else if (mode === 'motorcycle') {
            const key = `motorcycle_${size}`;
            factor = this.emissionFactors[key] || this.emissionFactors.motorcycle_medium;
        } else {
            factor = this.emissionFactors[mode] || 0;
        }
        
        return {
            distance: distance,
            emissionFactor: factor,
            totalEmissions: distance * factor,
            unit: 'kg CO2'
        };
    }

    /**
     * Get route using OSRM (Open Source Routing Machine)
     * Free alternative to Google Maps
     */
    async getRoute(startLat, startLon, endLat, endLon, profile = 'driving') {
        // Map OSRM profile to cache mode
        const cacheMode = profile === 'driving' ? 'car' : profile;
        
        // 1. CHECK CACHE FIRST ⚡
        const cached = await routeCacheService.get(startLat, startLon, endLat, endLon, cacheMode);
        if (cached) {
            return cached;  // Cache hit! Return immediately (10-50ms)
        }
        
        // 2. CACHE MISS - Calculate with OSRM
        try {
            // OSRM demo server - you can self-host for production
            const baseUrl = 'http://router.project-osrm.org/route/v1';
            const coordinates = `${startLon},${startLat};${endLon},${endLat}`;
            // Use polyline format instead of geojson for efficient encoding
            const url = `${baseUrl}/${profile}/${coordinates}?overview=full&geometries=polyline&steps=true`;
            
            console.log(`🌐 OSRM Request: ${profile} profile`);
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                throw new Error('No route found');
            }
            
            const route = data.routes[0];
            
            const result = {
                distance: route.distance / 1000, // Convert to km
                duration: route.duration / 60, // Convert to minutes
                geometry: route.geometry, // Now returns polyline-encoded string
                legs: route.legs.map(leg => ({
                    distance: leg.distance / 1000,
                    duration: leg.duration / 60,
                    steps: leg.steps.map(step => ({
                        distance: step.distance / 1000,
                        duration: step.duration / 60,
                        instruction: step.maneuver.instruction,
                        location: step.maneuver.location
                    }))
                }))
            };
            
            // Check if bike/foot profiles are returning driving times (means profile not available)
            // IMPORTANT: Do this BEFORE caching to store correct durations
            // Typical speeds: driving ~50 km/h, bike ~15 km/h, foot ~5 km/h
            if (profile === 'bike' || profile === 'foot') {
                const expectedSpeed = profile === 'bike' ? 15 : 5; // km/h
                const actualSpeed = (result.distance / (result.duration / 60)); // km/h from duration
                
                // If actual speed is way too fast for bike/foot, recalculate
                // Bikes rarely go > 25 km/h avg, walking rarely > 7 km/h
                const maxReasonableSpeed = profile === 'bike' ? 25 : 7;
                
                if (actualSpeed > maxReasonableSpeed) {
                    const expectedDuration = (result.distance / expectedSpeed) * 60; // minutes
                    console.log(`⚠️  ${profile} profile not available for this region (speed: ${actualSpeed.toFixed(1)} km/h), using estimated duration`);
                    result.duration = expectedDuration;
                    result.estimated = true;
                    // Keep geometry to show the route (even if it's along car roads)
                }
            }
            
            console.log(`✅ OSRM ${profile}: ${result.distance.toFixed(2)}km, ${result.duration.toFixed(2)}min`);
            
            // 3. STORE IN CACHE for next time 💾
            // Cache AFTER duration correction for bike/foot
            await routeCacheService.set(startLat, startLon, endLat, endLon, cacheMode, {
                distance: result.distance,
                duration: result.duration,
                emissions: 0,  // Will be calculated by caller
                geometry: result.geometry
            });
            
            return result;
            
        } catch (error) {
            console.error('Error fetching route from OSRM:', error.message);
            
            // Fallback: estimate distance using straight line * 1.3 (typical road factor)
            const straightDistance = this.calculateDistance(startLat, startLon, endLat, endLon);
            const estimatedDistance = straightDistance * 1.3;
            
            // Create a simple polyline for fallback (straight line between points)
            const fallbackPolyline = this.encodeSimplePolyline([[startLat, startLon], [endLat, endLon]]);
            
            return {
                distance: estimatedDistance,
                duration: estimatedDistance / 0.5, // Assuming 30 km/h average
                geometry: fallbackPolyline, // Return polyline-encoded string
                legs: [],
                estimated: true
            };
        }
    }

    /**
     * Encode a simple polyline for fallback routes
     * Simplified version - only used for straight-line fallbacks
     */
    encodeSimplePolyline(coordinates) {
        let encoded = '';
        let prevLat = 0;
        let prevLng = 0;

        for (const coord of coordinates) {
            const lat = Math.round(coord[0] * 1e5);
            const lng = Math.round(coord[1] * 1e5);
            
            encoded += this.encodeNumber(lat - prevLat);
            encoded += this.encodeNumber(lng - prevLng);
            
            prevLat = lat;
            prevLng = lng;
        }
        
        return encoded;
    }

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
     * Compare multiple transport modes for a route
     */
    async compareTransportModes(startLat, startLon, endLat, endLon, options = {}) {
        try {
            console.log(`Comparing transport modes from [${startLat},${startLon}] to [${endLat},${endLon}]`);
            
            // Get base route (driving)
            const drivingRoute = await this.getRoute(startLat, startLon, endLat, endLon, 'driving');
            const distance = drivingRoute.distance;
            
            // Define transport mode scenarios
            const scenarios = [];
            
            // Private vehicles - simplified to show only average car and motorcycle
            if (!options.excludePrivate) {
                // Car - Medium size, Petrol (average/typical vehicle)
                const carEmissions = this.calculateEmissions(distance, 'car', 'medium', 'petrol');
                scenarios.push({
                    id: 'car_medium_petrol',
                    mode: 'car',
                    name: 'Car (Average)',
                    category: 'private',
                    vehicle_size: 'Medium',
                    fuel_type: 'Petrol',
                    distance: distance,
                    duration: drivingRoute.duration,
                    carbonEmissions: carEmissions.totalEmissions,
                    emissionFactor: carEmissions.emissionFactor,
                    geometry: drivingRoute.geometry,
                    estimated: drivingRoute.estimated || false
                });
                
                // Motorcycle - Medium size (average motorcycle)
                const motorcycleEmissions = this.calculateEmissions(distance, 'motorcycle', 'medium');
                scenarios.push({
                    id: 'motorcycle_medium',
                    mode: 'motorcycle',
                    name: 'Motorcycle (Average)',
                    category: 'private',
                    vehicle_size: 'Medium',
                    distance: distance,
                    duration: drivingRoute.duration * 0.9, // Slightly faster
                    carbonEmissions: motorcycleEmissions.totalEmissions,
                    emissionFactor: motorcycleEmissions.emissionFactor,
                    geometry: drivingRoute.geometry,
                    estimated: drivingRoute.estimated || false
                });
            }
            
            // Public transport - REMOVED
            // Fake public transport scenarios removed - use /api/routing/transit/plan for real GTFS-based transit routing
            // The scenarios below were estimates using road geometry with PT emission factors
            // Real transit routing is now handled by transitRoutingService.js
            
            // Active transport - use OSRM bike/foot profiles (from public demo server)
            if (!options.excludeActive && distance <= 15) { // Only for reasonable distances
                // Bicycle - use OSRM bike profile for realistic cycling paths
                try {
                    const cyclingRoute = await this.getRoute(startLat, startLon, endLat, endLon, 'bike');
                    const cyclingEmissions = this.calculateEmissions(cyclingRoute.distance, 'bicycle');
                    scenarios.push({
                        id: 'bicycle',
                        mode: 'bicycle',
                        name: 'Bicycle',
                        category: 'active',
                        distance: cyclingRoute.distance,
                        duration: cyclingRoute.duration,
                        carbonEmissions: cyclingEmissions.totalEmissions,
                        emissionFactor: cyclingEmissions.emissionFactor,
                        geometry: cyclingRoute.geometry,
                        estimated: false
                    });
                } catch (error) {
                    console.warn('⚠️ Cycling route failed, using driving geometry:', error.message);
                    // Fallback to driving geometry with cycling speed
                    const cyclingEmissions = this.calculateEmissions(distance, 'bicycle');
                    scenarios.push({
                        id: 'bicycle',
                        mode: 'bicycle',
                        name: 'Bicycle',
                        category: 'active',
                        distance: distance,
                        duration: (distance / 15) * 60,
                        carbonEmissions: cyclingEmissions.totalEmissions,
                        emissionFactor: cyclingEmissions.emissionFactor,
                        geometry: drivingRoute.geometry,
                        estimated: true
                    });
                }
                
                // Walking - use OSRM foot profile for realistic walking paths
                try {
                    const walkingRoute = await this.getRoute(startLat, startLon, endLat, endLon, 'foot');
                    const walkingEmissions = this.calculateEmissions(walkingRoute.distance, 'walking');
                    scenarios.push({
                        id: 'walking',
                        mode: 'walking',
                        name: 'Walking',
                        category: 'active',
                        distance: walkingRoute.distance,
                        duration: walkingRoute.duration,
                        carbonEmissions: walkingEmissions.totalEmissions,
                        emissionFactor: walkingEmissions.emissionFactor,
                        geometry: walkingRoute.geometry,
                        estimated: false
                    });
                } catch (error) {
                    console.warn('⚠️ Walking route failed, using driving geometry:', error.message);
                    // Fallback to driving geometry with walking speed
                    const walkingEmissions = this.calculateEmissions(distance, 'walking');
                    scenarios.push({
                        id: 'walking',
                        mode: 'walking',
                        name: 'Walking',
                        category: 'active',
                        distance: distance,
                        duration: (distance / 5) * 60,
                        carbonEmissions: walkingEmissions.totalEmissions,
                        emissionFactor: walkingEmissions.emissionFactor,
                        geometry: drivingRoute.geometry,
                        estimated: true
                    });
                }
            }
            
            // Sort by emissions (ascending - lowest first)
            scenarios.sort((a, b) => a.carbonEmissions - b.carbonEmissions);
            
            // Add rankings and percentage comparisons
            const highestEmission = Math.max(...scenarios.map(s => s.carbonEmissions));
            scenarios.forEach((scenario, index) => {
                scenario.rank = index + 1;
                scenario.emissionsVsWorst = highestEmission > 0 
                    ? ((scenario.carbonEmissions / highestEmission) * 100).toFixed(1) 
                    : 0;
                scenario.savingsVsWorst = highestEmission - scenario.carbonEmissions;
            });
            
            return {
                success: true,
                origin: { latitude: startLat, longitude: startLon },
                destination: { latitude: endLat, longitude: endLon },
                directDistance: this.calculateDistance(startLat, startLon, endLat, endLon),
                routeDistance: distance,
                scenarios: scenarios,
                totalScenarios: scenarios.length,
                bestOption: scenarios[0],
                worstOption: scenarios[scenarios.length - 1],
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error comparing transport modes:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    capitalize(str) {
        if (str === 'bev') return 'BEV';
        if (str === 'phev') return 'PHEV';
        if (str === 'mrt') return 'MRT';
        if (str === 'lrt') return 'LRT';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Get emission factor from database
     */
    async getEmissionFactorFromDB(vehicleCategory, vehicleSize, fuelType) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                SELECT emission_factor 
                FROM vehicle_emission_factor 
                WHERE vehicle_category_id = (
                    SELECT id FROM vehicle_category WHERE name = $1
                )
                AND vehicle_size_id = (
                    SELECT id FROM vehicle_size WHERE name = $2
                )
                AND fuel_type_id = (
                    SELECT id FROM fuel_type WHERE name = $3
                )
            `, [vehicleCategory, vehicleSize, fuelType]);
            
            if (result.rows.length > 0) {
                return result.rows[0].emission_factor;
            }
            
            return null;
        } finally {
            client.release();
        }
    }

    /**
     * Save route comparison to database for history
     */
    async saveRouteComparison(userId, comparisonData) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                INSERT INTO route_comparisons (
                    user_id,
                    origin_lat,
                    origin_lon,
                    destination_lat,
                    destination_lon,
                    direct_distance,
                    route_distance,
                    scenarios,
                    best_option_id,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                RETURNING id
            `, [
                userId,
                comparisonData.origin.latitude,
                comparisonData.origin.longitude,
                comparisonData.destination.latitude,
                comparisonData.destination.longitude,
                comparisonData.directDistance,
                comparisonData.routeDistance,
                JSON.stringify(comparisonData.scenarios),
                comparisonData.bestOption.id
            ]);
            
            return result.rows[0].id;
        } catch (error) {
            console.error('Error saving route comparison:', error.message);
            return null;
        } finally {
            client.release();
        }
    }

    /**
     * Get route comparison history
     */
    async getRouteHistory(userId, limit = 10) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                SELECT *
                FROM route_comparisons
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2
            `, [userId, limit]);
            
            return result.rows.map(row => ({
                id: row.id,
                origin: {
                    latitude: row.origin_lat,
                    longitude: row.origin_lon
                },
                destination: {
                    latitude: row.destination_lat,
                    longitude: row.destination_lon
                },
                directDistance: row.direct_distance,
                routeDistance: row.route_distance,
                scenarios: row.scenarios,
                bestOptionId: row.best_option_id,
                createdAt: row.created_at
            }));
        } finally {
            client.release();
        }
    }
}

export default RoutingService;

