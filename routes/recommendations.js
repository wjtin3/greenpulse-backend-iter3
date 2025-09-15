import express from 'express';
import { recommendationService } from '../services/recommendationService.js';
import { vectorService } from '../services/vectorService.js';

const router = express.Router();

// Generate personalized recommendations using RAG
router.post('/generate', async (req, res) => {
    try {
        const { category, emissions, calculationData, sessionId, debugMode = false } = req.body;

        console.log('Recommendation generation request:', { 
            category, 
            emissions, 
            calculationDataKeys: Object.keys(calculationData || {}),
            sessionId,
            debugMode 
        });

        // Primary required fields: category and emissions
        if (!category || !emissions) {
            return res.status(400).json({
                error: 'Missing required fields: category, emissions',
                received: { category, emissions },
                message: 'Both category and emissions are required. calculationData is optional for additional context.'
            });
        }

        // Validate category
        const validCategories = ['travel', 'household', 'food', 'shopping'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                error: 'Invalid category',
                message: `Category must be one of: ${validCategories.join(', ')}`,
                received: category
            });
        }

        // Validate emissions
        const emissionsValue = parseFloat(emissions);
        if (isNaN(emissionsValue) || emissionsValue < 0) {
            return res.status(400).json({
                error: 'Invalid emissions',
                message: 'emissions must be a positive number',
                received: emissions
            });
        }

        const footprintData = {
            category,
            totalEmissions: emissionsValue,
            calculationData: calculationData || {}, // Make calculationData optional
            sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            debugMode
        };

        console.log('Processing recommendation request for category:', category);
        const result = await recommendationService.generateRecommendations(footprintData);
        console.log('Recommendation generation completed successfully');

        res.json({
            success: true,
            data: result,
            sessionId: footprintData.sessionId
        });

    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({
            error: 'Failed to generate recommendations',
            message: error.message,
            details: 'Error in recommendation generation service',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Search for similar recommendations
router.post('/search', async (req, res) => {
    try {
        const { query, category, limit = 5, similarityThreshold = 0.7 } = req.body;

        console.log('Recommendation search request:', { query, category, limit, similarityThreshold });

        if (!query || !category) {
            return res.status(400).json({
                error: 'Missing required fields: query, category',
                received: { query, category }
            });
        }

        // Validate category
        const validCategories = ['travel', 'household', 'food', 'shopping'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                error: 'Invalid category',
                message: `Category must be one of: ${validCategories.join(', ')}`,
                received: category
            });
        }

        // Validate limit
        const searchLimit = parseInt(limit);
        if (isNaN(searchLimit) || searchLimit < 1 || searchLimit > 50) {
            return res.status(400).json({
                error: 'Invalid limit',
                message: 'Limit must be a number between 1 and 50',
                received: limit
            });
        }

        console.log('Processing recommendation search...');
        const results = await vectorService.searchSimilarRecommendations(
            query,
            category,
            searchLimit,
            similarityThreshold
        );
        console.log('Recommendation search completed:', results.length, 'results found');

        res.json({
            success: true,
            data: results,
            count: results.length,
            query,
            category
        });

    } catch (error) {
        console.error('Error searching recommendations:', error);
        res.status(500).json({
            error: 'Failed to search recommendations',
            message: error.message,
            details: 'Error in vector search service',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get recommendations by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { impact_level, difficulty, cost_impact, limit = 10 } = req.query;

        const filters = {};
        if (impact_level) filters.impact_level = impact_level;
        if (difficulty) filters.difficulty = difficulty;
        if (cost_impact) filters.cost_impact = cost_impact;

        const results = await vectorService.getRecommendationsByCategory(
            category,
            filters,
            parseInt(limit)
        );

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Error getting recommendations by category:', error);
        res.status(500).json({
            error: 'Failed to get recommendations',
            message: error.message
        });
    }
});

// Get random recommendations (no user tracking)
router.get('/random/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 5 } = req.query;

        const results = await recommendationService.getRandomRecommendations(
            category,
            parseInt(limit)
        );

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Error getting random recommendations:', error);
        res.status(500).json({
            error: 'Failed to get random recommendations',
            message: error.message
        });
    }
});

// Track recommendation interaction - DISABLED (no user tracking)
router.post('/track-interaction', async (req, res) => {
    // User tracking disabled
    res.json({
        success: true,
        message: 'User tracking disabled - interaction not tracked'
    });
});

// Get emission factors
router.get('/emission-factors/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { subcategory } = req.query;

        const results = await recommendationService.getEmissionFactors(category, subcategory);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Error getting emission factors:', error);
        res.status(500).json({
            error: 'Failed to get emission factors',
            message: error.message
        });
    }
});

// Health check
router.get('/health', async (req, res) => {
    try {
        console.log('Recommendation service health check started...');
        
        // Test basic functionality
        const testResults = await vectorService.getRecommendationsByCategory('travel', {}, 1);
        
        console.log('Recommendation service health check completed successfully');
        res.json({
            success: true,
            status: 'Recommendation service is working',
            testResults: testResults.length,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        });

    } catch (error) {
        console.error('Recommendation service health check failed:', error);
        res.status(500).json({
            error: 'Recommendation service is not working',
            message: error.message,
            details: 'Health check failed for recommendation service',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        });
    }
});

export default router;
