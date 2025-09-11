import express from 'express';
import { cohereService } from '../services/cohereService.js';

const router = express.Router();

// Test Cohere embeddings endpoint
router.post('/test-embedding', async (req, res) => {
    try {
        const { text, type = 'search_document' } = req.body;

        if (!text) {
            return res.status(400).json({ 
                error: 'Text is required' 
            });
        }

        let result;
        if (type === 'search_query') {
            result = await cohereService.generateSearchEmbedding(text);
        } else {
            result = await cohereService.generateEmbedding(text);
        }

        res.json({
            success: true,
            text: text,
            type: type,
            embedding: {
                dimensions: result.length,
                firstFiveValues: result.slice(0, 5).map(v => v.toFixed(4))
            }
        });

    } catch (error) {
        console.error('Error generating embedding:', error);
        res.status(500).json({ 
            error: 'Failed to generate embedding',
            message: error.message 
        });
    }
});

// Test Cohere embeddings with debug info
router.post('/test-embedding-debug', async (req, res) => {
    try {
        const { text, type = 'search_document' } = req.body;

        if (!text) {
            return res.status(400).json({ 
                error: 'Text is required' 
            });
        }

        const result = await cohereService.generateEmbeddingWithDebug(text, type);

        res.json({
            success: true,
            text: text,
            type: type,
            embedding: {
                dimensions: result.embedding.length,
                firstFiveValues: result.embedding.slice(0, 5).map(v => v.toFixed(4))
            },
            debug: result.debug
        });

    } catch (error) {
        console.error('Error generating embedding with debug:', error);
        res.status(500).json({ 
            error: 'Failed to generate embedding',
            message: error.message 
        });
    }
});

// Test recommendation embedding
router.post('/test-recommendation-embedding', async (req, res) => {
    try {
        const { title, content, category, context, tags } = req.body;

        if (!title || !content || !category) {
            return res.status(400).json({ 
                error: 'Title, content, and category are required' 
            });
        }

        const recommendation = {
            title,
            content,
            category,
            context: context || '',
            tags: tags || []
        };

        const embedding = await cohereService.generateRecommendationEmbedding(recommendation);

        res.json({
            success: true,
            recommendation: recommendation,
            embedding: {
                dimensions: embedding.length,
                firstFiveValues: embedding.slice(0, 5).map(v => v.toFixed(4))
            }
        });

    } catch (error) {
        console.error('Error generating recommendation embedding:', error);
        res.status(500).json({ 
            error: 'Failed to generate recommendation embedding',
            message: error.message 
        });
    }
});

// Health check for Cohere service
router.get('/health', async (req, res) => {
    try {
        // Test with a simple embedding to verify service is working
        const testEmbedding = await cohereService.generateEmbedding("test");
        
        res.json({
            success: true,
            status: 'Cohere service is working',
            testEmbedding: {
                dimensions: testEmbedding.length,
                firstFiveValues: testEmbedding.slice(0, 5).map(v => v.toFixed(4))
            }
        });

    } catch (error) {
        console.error('Cohere service health check failed:', error);
        res.status(500).json({ 
            error: 'Cohere service is not working',
            message: error.message 
        });
    }
});

export default router;
