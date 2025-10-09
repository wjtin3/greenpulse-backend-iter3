import fetch from 'node-fetch';
import { pool } from '../config/database.js';

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
        try {
            // OSRM demo server - you can self-host for production
            const baseUrl = 'http://router.project-osrm.org/route/v1';
            const coordinates = `${startLon},${startLat};${endLon},${endLat}`;
            const url = `${baseUrl}/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                throw new Error('No route found');
            }
            
            const route = data.routes[0];
            
            return {
                distance: route.distance / 1000, // Convert to km
                duration: route.duration / 60, // Convert to minutes
                geometry: route.geometry,
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
        } catch (error) {
            console.error('Error fetching route from OSRM:', error.message);
            
            // Fallback: estimate distance using straight line * 1.3 (typical road factor)
            const straightDistance = this.calculateDistance(startLat, startLon, endLat, endLon);
            const estimatedDistance = straightDistance * 1.3;
            
            return {
                distance: estimatedDistance,
                duration: estimatedDistance / 0.5, // Assuming 30 km/h average
                geometry: {
                    type: 'LineString',
                    coordinates: [[startLon, startLat], [endLon, endLat]]
                },
                legs: [],
                estimated: true
            };
        }
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
            
            // Private vehicles
            if (!options.excludePrivate) {
                const vehicleSizes = options.vehicleSizes || ['small', 'medium', 'large'];
                const fuelTypes = options.fuelTypes || ['petrol', 'diesel', 'hybrid', 'phev', 'bev'];
                
                for (const size of vehicleSizes) {
                    for (const fuel of fuelTypes) {
                        const emissions = this.calculateEmissions(distance, 'car', size, fuel);
                        scenarios.push({
                            id: `car_${size}_${fuel}`,
                            mode: 'car',
                            name: `Car (${this.capitalize(size)}, ${this.capitalize(fuel)})`,
                            category: 'private',
                            size: size,
                            fuelType: fuel,
                            distance: distance,
                            duration: drivingRoute.duration,
                            emissions: emissions.totalEmissions,
                            emissionFactor: emissions.emissionFactor,
                            geometry: drivingRoute.geometry,
                            estimated: drivingRoute.estimated || false
                        });
                    }
                }
                
                // Motorcycles
                const motorcycleSizes = ['small', 'medium', 'large'];
                for (const size of motorcycleSizes) {
                    const emissions = this.calculateEmissions(distance, 'motorcycle', size);
                    scenarios.push({
                        id: `motorcycle_${size}`,
                        mode: 'motorcycle',
                        name: `Motorcycle (${this.capitalize(size)})`,
                        category: 'private',
                        size: size,
                        distance: distance,
                        duration: drivingRoute.duration * 0.9, // Slightly faster
                        emissions: emissions.totalEmissions,
                        emissionFactor: emissions.emissionFactor,
                        geometry: drivingRoute.geometry,
                        estimated: drivingRoute.estimated || false
                    });
                }
            }
            
            // Public transport
            if (!options.excludePublic) {
                const publicModes = [
                    { mode: 'bus', name: 'Bus', speedFactor: 1.5 },
                    { mode: 'mrt', name: 'MRT', speedFactor: 1.2 },
                    { mode: 'lrt', name: 'LRT', speedFactor: 1.3 },
                    { mode: 'train', name: 'Train', speedFactor: 1.2 }
                ];
                
                for (const transport of publicModes) {
                    const emissions = this.calculateEmissions(distance, transport.mode);
                    scenarios.push({
                        id: transport.mode,
                        mode: transport.mode,
                        name: transport.name,
                        category: 'public',
                        distance: distance,
                        duration: drivingRoute.duration * transport.speedFactor,
                        emissions: emissions.totalEmissions,
                        emissionFactor: emissions.emissionFactor,
                        geometry: drivingRoute.geometry,
                        estimated: true,
                        note: 'Estimated route and duration - actual public transport routes may vary'
                    });
                }
            }
            
            // Active transport
            if (!options.excludeActive && distance <= 15) { // Only for reasonable distances
                const activeModes = [
                    { mode: 'bicycle', name: 'Bicycle', avgSpeed: 15 },
                    { mode: 'walking', name: 'Walking', avgSpeed: 5 }
                ];
                
                for (const transport of activeModes) {
                    const emissions = this.calculateEmissions(distance, transport.mode);
                    scenarios.push({
                        id: transport.mode,
                        mode: transport.mode,
                        name: transport.name,
                        category: 'active',
                        distance: distance,
                        duration: (distance / transport.avgSpeed) * 60, // Convert to minutes
                        emissions: emissions.totalEmissions,
                        emissionFactor: emissions.emissionFactor,
                        geometry: drivingRoute.geometry,
                        estimated: true
                    });
                }
            }
            
            // Sort by emissions (ascending - lowest first)
            scenarios.sort((a, b) => a.emissions - b.emissions);
            
            // Add rankings and percentage comparisons
            const highestEmission = Math.max(...scenarios.map(s => s.emissions));
            scenarios.forEach((scenario, index) => {
                scenario.rank = index + 1;
                scenario.emissionsVsWorst = highestEmission > 0 
                    ? ((scenario.emissions / highestEmission) * 100).toFixed(1) 
                    : 0;
                scenario.savingsVsWorst = highestEmission - scenario.emissions;
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

