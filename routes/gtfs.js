import express from 'express';
import GTFSService from '../services/gtfsService.js';

const router = express.Router();
const gtfsService = new GTFSService();

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

export default router;
