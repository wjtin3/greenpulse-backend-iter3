import express from 'express';
import GTFSService from '../services/gtfsService.js';
import GTFSRealtimeService from '../services/gtfsRealtimeService.js';

const router = express.Router();
const gtfsService = new GTFSService();
const gtfsRealtimeService = new GTFSRealtimeService();

/**
 * GET /api/gtfs/info
 * Get information about the GTFS API and available categories
 */
router.get('/info', async (req, res) => {
    try {
        const apiInfo = gtfsService.getAPIInfo();
        res.json({
            success: true,
            data: apiInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting GTFS API info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GTFS API information',
            message: error.message
        });
    }
});

/**
 * GET /api/gtfs/categories
 * Get available Prasarana categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = gtfsService.getAvailableCategories();
        const categoryInfo = categories.map(category => ({
            category: category,
            description: gtfsService.getCategoryDescription(category)
        }));

        res.json({
            success: true,
            data: {
                categories: categoryInfo,
                total: categories.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting GTFS categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get GTFS categories',
            message: error.message
        });
    }
});

/**
 * POST /api/gtfs/download
 * Download GTFS data for specific categories
 * Body: { categories: ['rapid-bus-mrtfeeder', 'rapid-rail-kl', 'rapid-bus-kl'] }
 */
router.post('/download', async (req, res) => {
    try {
        const { categories } = req.body;

        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'Please provide an array of categories to download'
            });
        }

        // Validate categories
        const availableCategories = gtfsService.getAvailableCategories();
        const invalidCategories = categories.filter(cat => !availableCategories.includes(cat));
        
        if (invalidCategories.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid categories',
                message: `Invalid categories: ${invalidCategories.join(', ')}. Available categories: ${availableCategories.join(', ')}`
            });
        }

        console.log(`Starting GTFS download for categories: ${categories.join(', ')}`);
        
        const results = await gtfsService.downloadMultipleCategories(categories);
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            data: {
                results: results,
                summary: {
                    total: results.length,
                    successful: successCount,
                    failed: failureCount,
                    categories: categories
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error downloading GTFS data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download GTFS data',
            message: error.message
        });
    }
});

/**
 * POST /api/gtfs/download/category/:category
 * Download GTFS data for a specific category
 */
router.post('/download/category/:category', async (req, res) => {
    try {
        const { category } = req.params;

        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'Please provide a category parameter'
            });
        }

        console.log(`Starting GTFS download for category: ${category}`);
        
        const result = await gtfsService.downloadGTFSData(category);
        
        if (result.success) {
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Download failed',
                data: result
            });
        }

    } catch (error) {
        console.error('Error downloading GTFS data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download GTFS data',
            message: error.message
        });
    }
});

/**
 * POST /api/gtfs/download/all
 * Download GTFS data for all available Prasarana categories
 */
router.post('/download/all', async (req, res) => {
    try {
        console.log('Starting GTFS download for all available categories');
        
        const results = await gtfsService.downloadAllCategories();
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            data: {
                results: results,
                summary: {
                    total: results.length,
                    successful: successCount,
                    failed: failureCount,
                    categories: gtfsService.getAvailableCategories()
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error downloading all GTFS data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download GTFS data',
            message: error.message
        });
    }
});

/**
 * GET /api/gtfs/files
 * List all downloaded GTFS files
 */
router.get('/files', async (req, res) => {
    try {
        const files = gtfsService.listDownloadedFiles();
        
        // Calculate total files and size
        let totalFiles = 0;
        let totalSize = 0;
        
        for (const categoryFiles of Object.values(files)) {
            totalFiles += categoryFiles.length;
            totalSize += categoryFiles.reduce((sum, file) => sum + file.size, 0);
        }

        res.json({
            success: true,
            data: {
                files: files,
                summary: {
                    totalFiles: totalFiles,
                    totalSize: totalSize,
                    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                    categories: Object.keys(files)
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error listing GTFS files:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list GTFS files',
            message: error.message
        });
    }
});

/**
 * DELETE /api/gtfs/cleanup
 * Clean up old GTFS files (keep only the latest 3 files per category)
 */
router.delete('/cleanup', async (req, res) => {
    try {
        console.log('Starting GTFS file cleanup');
        
        const cleanupResults = gtfsService.cleanupOldFiles();
        
        res.json({
            success: true,
            data: cleanupResults,
            message: `Cleanup completed. Deleted ${cleanupResults.deleted.length} files, kept ${cleanupResults.kept.length} categories with recent files.`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error cleaning up GTFS files:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup GTFS files',
            message: error.message
        });
    }
});

/**
 * GET /api/gtfs/health
 * Health check for GTFS service
 */
router.get('/health', async (req, res) => {
    try {
        const apiInfo = gtfsService.getAPIInfo();
        const files = gtfsService.listDownloadedFiles();
        
        res.json({
            success: true,
            data: {
                service: 'GTFS Service',
                status: 'healthy',
                apiInfo: {
                    baseUrl: apiInfo.baseUrl,
                    availableCategories: apiInfo.prasaranaCategories.length
                },
                downloadedFiles: {
                    totalCategories: Object.keys(files).length,
                    totalFiles: Object.values(files).reduce((sum, categoryFiles) => sum + categoryFiles.length, 0)
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error checking GTFS service health:', error);
        res.status(500).json({
            success: false,
            error: 'GTFS service health check failed',
            message: error.message
        });
    }
});

// ==================== GTFS REALTIME ENDPOINTS ====================

/**
 * GET /api/gtfs/realtime/health
 * Health check for GTFS Realtime service
 */
router.get('/realtime/health', async (req, res) => {
    try {
        const health = await gtfsRealtimeService.getServiceHealth();
        
        if (health.success) {
            res.json({
                success: true,
                data: health,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                data: health,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Error checking GTFS Realtime service health:', error);
        res.status(500).json({
            success: false,
            error: 'GTFS Realtime service health check failed',
            message: error.message
        });
    }
});

/**
 * GET /api/gtfs/realtime/categories
 * Get available realtime categories
 */
router.get('/realtime/categories', async (req, res) => {
    try {
        const categories = gtfsRealtimeService.getAvailableCategories();
        
        res.json({
            success: true,
            data: {
                categories: categories,
                total: categories.length,
                description: 'Available categories for GTFS Realtime vehicle positions'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting realtime categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get realtime categories',
            message: error.message
        });
    }
});

/**
 * POST /api/gtfs/realtime/refresh/:category
 * Refresh vehicle positions for a specific category
 * Fetches latest data from API and stores in database (replaces old data)
 */
router.post('/realtime/refresh/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const clearOld = req.body.clearOld !== false; // Default true

        console.log(`Refreshing vehicle positions for category: ${category}`);
        
        const result = await gtfsRealtimeService.refreshVehiclePositions(category, clearOld);
        
        if (result.success) {
            res.json({
                success: true,
                data: result,
                message: `Successfully refreshed vehicle positions for ${category}`,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(400).json({
                success: false,
                data: result,
                message: `Failed to refresh vehicle positions for ${category}`
            });
        }

    } catch (error) {
        console.error('Error refreshing vehicle positions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh vehicle positions',
            message: error.message
        });
    }
});

/**
 * POST /api/gtfs/realtime/refresh
 * Refresh vehicle positions for multiple categories
 * Body: { categories: ['rapid-bus-kl', 'rapid-bus-mrtfeeder'], clearOld: true }
 */
router.post('/realtime/refresh', async (req, res) => {
    try {
        const { categories, clearOld = true } = req.body;

        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'Please provide an array of categories to refresh'
            });
        }

        // Validate categories
        const availableCategories = gtfsRealtimeService.getAvailableCategories();
        const invalidCategories = categories.filter(cat => !availableCategories.includes(cat));
        
        if (invalidCategories.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid categories',
                message: `Invalid categories: ${invalidCategories.join(', ')}. Available: ${availableCategories.join(', ')}`
            });
        }

        console.log(`Refreshing vehicle positions for categories: ${categories.join(', ')}`);
        
        const results = await gtfsRealtimeService.refreshMultipleCategories(categories, clearOld);
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            data: {
                results: results,
                summary: {
                    total: results.length,
                    successful: successCount,
                    failed: failureCount,
                    categories: categories
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error refreshing multiple vehicle positions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh vehicle positions',
            message: error.message
        });
    }
});

/**
 * POST /api/gtfs/realtime/refresh/all
 * Refresh vehicle positions for all available categories
 */
router.post('/realtime/refresh/all', async (req, res) => {
    try {
        const clearOld = req.body.clearOld !== false; // Default true

        console.log('Refreshing vehicle positions for all available categories');
        
        const results = await gtfsRealtimeService.refreshAllCategories(clearOld);
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
            success: true,
            data: {
                results: results,
                summary: {
                    total: results.length,
                    successful: successCount,
                    failed: failureCount,
                    categories: gtfsRealtimeService.getAvailableCategories()
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error refreshing all vehicle positions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh all vehicle positions',
            message: error.message
        });
    }
});

/**
 * GET /api/gtfs/realtime/vehicles/:category
 * Get latest vehicle positions for a category from database
 * Query params: minutesOld (default: 10)
 */
router.get('/realtime/vehicles/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const minutesOld = parseInt(req.query.minutesOld) || 10;

        const result = await gtfsRealtimeService.getLatestVehiclePositions(category, minutesOld);
        
        if (result.success) {
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(400).json({
                success: false,
                data: result
            });
        }

    } catch (error) {
        console.error('Error getting vehicle positions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get vehicle positions',
            message: error.message
        });
    }
});

/**
 * GET /api/gtfs/realtime/vehicles
 * Get all current vehicle positions across all categories
 */
router.get('/realtime/vehicles', async (req, res) => {
    try {
        const result = await gtfsRealtimeService.getAllCurrentVehiclePositions();
        
        if (result.success) {
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                data: result
            });
        }

    } catch (error) {
        console.error('Error getting all vehicle positions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get all vehicle positions',
            message: error.message
        });
    }
});

/**
 * GET /api/gtfs/realtime/vehicles/nearby/:category
 * Get vehicle positions near a location
 * Query params: lat, lon, radius (in km), minutesOld (default: 10)
 */
router.get('/realtime/vehicles/nearby/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { lat, lon, radius } = req.query;
        const minutesOld = parseInt(req.query.minutesOld) || 10;

        if (!lat || !lon || !radius) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'Please provide lat, lon, and radius query parameters'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        const radiusKm = parseFloat(radius);

        if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid parameters',
                message: 'lat, lon, and radius must be valid numbers'
            });
        }

        const result = await gtfsRealtimeService.getVehiclePositionsNearby(
            latitude, 
            longitude, 
            radiusKm, 
            category, 
            minutesOld
        );
        
        if (result.success) {
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(400).json({
                success: false,
                data: result
            });
        }

    } catch (error) {
        console.error('Error getting nearby vehicle positions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get nearby vehicle positions',
            message: error.message
        });
    }
});

/**
 * DELETE /api/gtfs/realtime/cleanup/:category
 * Clean up old vehicle position records
 * Query params: hoursToKeep (default: 24)
 */
router.delete('/realtime/cleanup/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const hoursToKeep = parseInt(req.query.hoursToKeep) || 24;

        console.log(`Cleaning up old vehicle positions for ${category} (keeping last ${hoursToKeep} hours)`);
        
        const result = await gtfsRealtimeService.cleanupOldRecords(category, hoursToKeep);
        
        if (result.success) {
            res.json({
                success: true,
                data: result,
                message: `Cleaned up ${result.deletedCount} old records for ${category}`,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(400).json({
                success: false,
                data: result
            });
        }

    } catch (error) {
        console.error('Error cleaning up vehicle positions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup vehicle positions',
            message: error.message
        });
    }
});

export default router;
