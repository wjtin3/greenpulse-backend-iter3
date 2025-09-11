import express from 'express';
import { groqService } from '../services/groqService.js';

const router = express.Router();

// Test Groq service endpoint
router.get('/test', async (req, res) => {
    try {
        const result = await groqService.testService();
        
        res.json({
            success: result.success,
            message: result.success ? 'Groq service is working' : 'Groq service test failed',
            data: result
        });

    } catch (error) {
        console.error('Error testing Groq service:', error);
        res.status(500).json({ 
            error: 'Failed to test Groq service',
            message: error.message 
        });
    }
});

// Generate general text
router.post('/generate-text', async (req, res) => {
    try {
        const { prompt, temperature = 0.7, max_tokens = 3000, systemPrompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ 
                error: 'Prompt is required' 
            });
        }

        const response = await groqService.generateText(prompt, {
            temperature: parseFloat(temperature),
            max_tokens: parseInt(max_tokens),
            systemPrompt
        });

        res.json({
            success: true,
            prompt: prompt,
            response: response,
            options: {
                temperature: parseFloat(temperature),
                max_tokens: parseInt(max_tokens),
                systemPrompt: systemPrompt || null
            }
        });

    } catch (error) {
        console.error('Error generating text:', error);
        res.status(500).json({ 
            error: 'Failed to generate text',
            message: error.message 
        });
    }
});

// Generate carbon footprint summary
router.post('/generate-summary', async (req, res) => {
    try {
        const { category, emissions, userData } = req.body;

        if (!category || !emissions || !userData) {
            return res.status(400).json({ 
                error: 'Category, emissions, and userData are required' 
            });
        }

        const summary = await groqService.generateFootprintSummary(
            category, 
            parseFloat(emissions), 
            userData
        );

        res.json({
            success: true,
            category: category,
            emissions: parseFloat(emissions),
            summary: summary
        });

    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({ 
            error: 'Failed to generate summary',
            message: error.message 
        });
    }
});

// Generate recommendations
router.post('/generate-recommendations', async (req, res) => {
    try {
        const { category, userEmissions, userData, similarRecommendations } = req.body;

        if (!category || !userEmissions || !userData) {
            return res.status(400).json({ 
                error: 'Category, userEmissions, and userData are required' 
            });
        }

        const context = {
            category,
            userEmissions: parseFloat(userEmissions),
            userData,
            similarRecommendations: similarRecommendations || []
        };

        const recommendations = await groqService.generateRecommendations(context);

        res.json({
            success: true,
            context: context,
            recommendations: recommendations
        });

    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ 
            error: 'Failed to generate recommendations',
            message: error.message 
        });
    }
});

// Update model configuration
router.post('/update-models', async (req, res) => {
    try {
        const { primaryModel, backupModel } = req.body;

        if (!primaryModel || !backupModel) {
            return res.status(400).json({ 
                error: 'Both primaryModel and backupModel are required' 
            });
        }

        groqService.setModels(primaryModel, backupModel);

        res.json({
            success: true,
            message: 'Models updated successfully',
            models: {
                primary: primaryModel,
                backup: backupModel
            }
        });

    } catch (error) {
        console.error('Error updating models:', error);
        res.status(500).json({ 
            error: 'Failed to update models',
            message: error.message 
        });
    }
});

// Get current model configuration
router.get('/models', async (req, res) => {
    try {
        res.json({
            success: true,
            models: {
                primary: groqService.primaryModel,
                backup: groqService.backupModel
            }
        });

    } catch (error) {
        console.error('Error getting models:', error);
        res.status(500).json({ 
            error: 'Failed to get models',
            message: error.message 
        });
    }
});

// Health check for Groq service
router.get('/health', async (req, res) => {
    try {
        // Test with a simple prompt to verify service is working
        const testResult = await groqService.testService();
        
        res.json({
            success: testResult.success,
            status: testResult.success ? 'Groq service is working' : 'Groq service is not working',
            model: testResult.model,
            testResponse: testResult.success ? testResult.response.substring(0, 100) + '...' : null,
            error: testResult.success ? null : testResult.error
        });

    } catch (error) {
        console.error('Groq service health check failed:', error);
        res.status(500).json({ 
            error: 'Groq service is not working',
            message: error.message 
        });
    }
});

export default router;
