import express from 'express';
import { recommendationService } from '../services/recommendationService.js';
import { vectorService } from '../services/vectorService.js';

const router = express.Router();

// Generate personalized recommendations using RAG
router.post('/generate', async (req, res) => {
    try {
        const { category, totalEmissions, calculationData, sessionId, debugMode = false } = req.body;

        if (!category || !totalEmissions || !calculationData) {
            return res.status(400).json({
                error: 'Missing required fields: category, totalEmissions, calculationData'
            });
        }

        const footprintData = {
            category,
            totalEmissions: parseFloat(totalEmissions),
            calculationData,
            sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            debugMode
        };

        const result = await recommendationService.generateRecommendations(footprintData);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({
            error: 'Failed to generate recommendations',
            message: error.message
        });
    }
});

// Search for similar recommendations
router.post('/search', async (req, res) => {
    try {
        const { query, category, limit = 5, similarityThreshold = 0.7 } = req.body;

        if (!query || !category) {
            return res.status(400).json({
                error: 'Missing required fields: query, category'
            });
        }

        const results = await vectorService.searchSimilarRecommendations(
            query,
            category,
            limit,
            similarityThreshold
        );

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Error searching recommendations:', error);
        res.status(500).json({
            error: 'Failed to search recommendations',
            message: error.message
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

// Get popular recommendations
router.get('/popular/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 5 } = req.query;

        const results = await recommendationService.getPopularRecommendations(
            category,
            parseInt(limit)
        );

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Error getting popular recommendations:', error);
        res.status(500).json({
            error: 'Failed to get popular recommendations',
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
        // Test basic functionality
        const testResults = await vectorService.getRecommendationsByCategory('travel', {}, 1);
        
        res.json({
            success: true,
            status: 'Recommendation service is working',
            testResults: testResults.length
        });

    } catch (error) {
        console.error('Recommendation service health check failed:', error);
        res.status(500).json({
            error: 'Recommendation service is not working',
            message: error.message
        });
    }
});

export default router;
