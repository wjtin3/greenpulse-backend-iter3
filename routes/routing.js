import express from 'express';
import RoutingService from '../services/routingService.js';
import TransitRoutingService from '../services/transitRoutingService.js';

const router = express.Router();
const routingService = new RoutingService();
const transitRoutingService = new TransitRoutingService();

/**
 * POST /api/routing/compare
 * Compare carbon emissions across different transport modes for a route
 * 
 * Body: {
 *   origin: { latitude: number, longitude: number },
 *   destination: { latitude: number, longitude: number },
 *   options: {
 *     vehicleSizes: ['small', 'medium', 'large'],
 *     fuelTypes: ['petrol', 'diesel', 'hybrid', 'phev', 'bev'],
 *     excludePrivate: false,
 *     excludePublic: false,
 *     excludeActive: false
 *   },
 *   userId: string (optional, for saving history)
 * }
 */
router.post('/compare', async (req, res) => {
    try {
        const { origin, destination, options = {}, userId } = req.body;

        // Validation
        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Please provide origin and destination coordinates'
            });
        }

        if (!origin.latitude || !origin.longitude) {
            return res.status(400).json({
                success: false,
                error: 'Invalid origin',
                message: 'Origin must include latitude and longitude'
            });
        }

        if (!destination.latitude || !destination.longitude) {
            return res.status(400).json({
                success: false,
                error: 'Invalid destination',
                message: 'Destination must include latitude and longitude'
            });
        }

        console.log(`Comparing routes from [${origin.latitude},${origin.longitude}] to [${destination.latitude},${destination.longitude}]`);

        // Compare transport modes
        const comparison = await routingService.compareTransportModes(
            origin.latitude,
            origin.longitude,
            destination.latitude,
            destination.longitude,
            options
        );

        if (!comparison.success) {
            return res.status(500).json({
                success: false,
                error: 'Route comparison failed',
                message: comparison.error
            });
        }

        // Save to history if userId provided
        if (userId) {
            const comparisonId = await routingService.saveRouteComparison(userId, comparison);
            comparison.savedId = comparisonId;
        }

        res.json({
            success: true,
            data: comparison,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in route comparison:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare routes',
            message: error.message
        });
    }
});

/**
 * POST /api/routing/compare/quick
 * Quick comparison with default options
 * 
 * Body: {
 *   origin: { latitude: number, longitude: number },
 *   destination: { latitude: number, longitude: number }
 * }
 */
router.post('/compare/quick', async (req, res) => {
    try {
        const { origin, destination } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Please provide origin and destination coordinates'
            });
        }

        // Quick comparison with only key vehicle types
        const options = {
            vehicleSizes: ['medium'],
            fuelTypes: ['petrol', 'hybrid', 'bev'],
            excludeActive: false,
            excludePublic: false,
            excludePrivate: false
        };

        const comparison = await routingService.compareTransportModes(
            origin.latitude,
            origin.longitude,
            destination.latitude,
            destination.longitude,
            options
        );

        if (!comparison.success) {
            return res.status(500).json({
                success: false,
                error: 'Route comparison failed',
                message: comparison.error
            });
        }

        // Return only top 5 options
        comparison.scenarios = comparison.scenarios.slice(0, 5);
        comparison.totalScenarios = comparison.scenarios.length;

        res.json({
            success: true,
            data: comparison,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in quick route comparison:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare routes',
            message: error.message
        });
    }
});

/**
 * GET /api/routing/distance
 * Calculate distance between two points
 * 
 * Query params: originLat, originLon, destLat, destLon
 */
router.get('/distance', async (req, res) => {
    try {
        const { originLat, originLon, destLat, destLon } = req.query;

        if (!originLat || !originLon || !destLat || !destLon) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Please provide originLat, originLon, destLat, and destLon'
            });
        }

        const lat1 = parseFloat(originLat);
        const lon1 = parseFloat(originLon);
        const lat2 = parseFloat(destLat);
        const lon2 = parseFloat(destLon);

        if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                message: 'All coordinates must be valid numbers'
            });
        }

        const distance = routingService.calculateDistance(lat1, lon1, lat2, lon2);

        res.json({
            success: true,
            data: {
                origin: { latitude: lat1, longitude: lon1 },
                destination: { latitude: lat2, longitude: lon2 },
                distance: distance,
                unit: 'km'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error calculating distance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate distance',
            message: error.message
        });
    }
});

/**
 * POST /api/routing/emissions
 * Calculate emissions for a specific transport mode and distance
 * 
 * Body: {
 *   distance: number (km),
 *   mode: 'car' | 'motorcycle' | 'bus' | 'mrt' | 'bicycle' | 'walking',
 *   size: 'small' | 'medium' | 'large' (for car/motorcycle),
 *   fuelType: 'petrol' | 'diesel' | 'hybrid' | 'phev' | 'bev' (for car)
 * }
 */
router.post('/emissions', async (req, res) => {
    try {
        const { distance, mode, size = 'medium', fuelType = 'petrol' } = req.body;

        if (!distance || !mode) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Please provide distance and mode'
            });
        }

        const distanceNum = parseFloat(distance);
        if (isNaN(distanceNum) || distanceNum <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid distance',
                message: 'Distance must be a positive number'
            });
        }

        const emissions = routingService.calculateEmissions(distanceNum, mode, size, fuelType);

        res.json({
            success: true,
            data: {
                mode: mode,
                size: size,
                fuelType: fuelType,
                ...emissions
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error calculating emissions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate emissions',
            message: error.message
        });
    }
});

/**
 * GET /api/routing/history/:userId
 * Get route comparison history for a user
 * 
 * Query params: limit (default: 10)
 */
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'Missing userId',
                message: 'Please provide a userId'
            });
        }

        const history = await routingService.getRouteHistory(userId, limit);

        res.json({
            success: true,
            data: {
                userId: userId,
                history: history,
                count: history.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting route history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get route history',
            message: error.message
        });
    }
});

/**
 * GET /api/routing/emission-factors
 * Get all emission factors
 */
router.get('/emission-factors', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                factors: routingService.emissionFactors,
                unit: 'kg CO2 per km',
                description: 'Carbon emission factors for different transport modes'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting emission factors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get emission factors',
            message: error.message
        });
    }
});

/**
 * POST /api/routing/transit/plan
 * Plan a public transport route with step-by-step directions
 * Uses actual GTFS data for stops, routes, and schedules
 * 
 * Body: {
 *   origin: { latitude: number, longitude: number },
 *   destination: { latitude: number, longitude: number }
 * }
 */
router.post('/transit/plan', async (req, res) => {
    try {
        const { origin, destination } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Please provide origin and destination coordinates'
            });
        }

        if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coordinates',
                message: 'Origin and destination must include valid latitude and longitude'
            });
        }

        console.log(`Planning transit route from [${origin.latitude},${origin.longitude}] to [${destination.latitude},${destination.longitude}]`);

        const result = await transitRoutingService.planTransitRoute(
            origin.latitude,
            origin.longitude,
            destination.latitude,
            destination.longitude
        );

        if (result.success) {
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: result.error,
                suggestion: result.suggestion,
                originStops: result.originStops,
                destStops: result.destStops,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Error planning transit route:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to plan transit route',
            message: error.message
        });
    }
});

/**
 * GET /api/routing/transit/stops/nearby
 * Find public transport stops near a location
 * 
 * Query params: lat, lon, radius (km, default: 1.5), limit (default: 10)
 */
router.get('/transit/stops/nearby', async (req, res) => {
    try {
        const { lat, lon, radius, limit } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Please provide lat and lon query parameters'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        const radiusKm = radius ? parseFloat(radius) : 1.5;
        const limitNum = limit ? parseInt(limit) : 10;

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coordinates',
                message: 'lat and lon must be valid numbers'
            });
        }

        const stops = await transitRoutingService.findNearbyStops(latitude, longitude, radiusKm, limitNum);

        res.json({
            success: true,
            data: {
                location: { latitude, longitude },
                radius: radiusKm,
                stops: stops,
                count: stops.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error finding nearby stops:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to find nearby stops',
            message: error.message
        });
    }
});

/**
 * GET /api/routing/transit/stop/:stopId/:category
 * Get detailed information about a specific stop
 */
router.get('/transit/stop/:stopId/:category', async (req, res) => {
    try {
        const { stopId, category } = req.params;

        const stopDetails = await transitRoutingService.getStopDetails(stopId, category);

        if (!stopDetails) {
            return res.status(404).json({
                success: false,
                error: 'Stop not found',
                message: `Stop ${stopId} not found in category ${category}`
            });
        }

        // Get routes at this stop
        const routes = await transitRoutingService.getRoutesAtStop(stopId, category);

        res.json({
            success: true,
            data: {
                stop: stopDetails,
                routes: routes,
                routeCount: routes.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting stop details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stop details',
            message: error.message
        });
    }
});

/**
 * GET /api/routing/transit/summary
 * Get summary of available transit systems
 */
router.get('/transit/summary', async (req, res) => {
    try {
        const summary = await transitRoutingService.getTransitSystemSummary();

        res.json({
            success: true,
            data: {
                systems: summary,
                description: 'Available GTFS transit data in database'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting transit summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get transit summary',
            message: error.message
        });
    }
});

/**
 * GET /api/routing/health
 * Health check for routing service
 */
router.get('/health', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                service: 'Routing Service',
                status: 'healthy',
                features: [
                    'Route comparison',
                    'Multi-modal transport',
                    'Carbon emission calculation',
                    'Distance calculation',
                    'Route history'
                ],
                supportedModes: [
                    'car (multiple sizes and fuel types)',
                    'motorcycle (small, medium, large)',
                    'bus',
                    'mrt',
                    'lrt',
                    'train',
                    'bicycle',
                    'walking'
                ]
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in routing health check:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error.message
        });
    }
});

export default router;

