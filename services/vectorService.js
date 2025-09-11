import { cohereService } from './cohereService.js';
import { pool } from '../config/database.js';

export class VectorService {
    /**
     * Store a recommendation with its embedding
     */
    async storeRecommendation(recommendation) {
        try {
            // Generate embedding for the recommendation
            const embedding = await cohereService.generateRecommendationEmbedding({
                title: recommendation.title,
                content: recommendation.content,
                category: recommendation.category,
                context: recommendation.context,
                tags: recommendation.tags
            });

            // Store in database with embedding
            const result = await pool.query(`
                INSERT INTO recommendations_kb (
                    category, title, content, context, 
                    impact_level, difficulty, cost_impact, tags, embedding
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `, [
                recommendation.category,
                recommendation.title,
                recommendation.content,
                recommendation.context,
                recommendation.impact_level,
                recommendation.difficulty,
                recommendation.cost_impact,
                JSON.stringify(recommendation.tags),
                JSON.stringify(embedding)
            ]);

            return result.rows[0].id;
        } catch (error) {
            console.error('Error storing recommendation:', error);
            throw error;
        }
    }

    /**
     * Search for similar recommendations using vector similarity
     */
    async searchSimilarRecommendations(query, category, limit = 5, similarityThreshold = 0.7) {
        try {
            // Generate embedding for the search query
            const queryEmbedding = await cohereService.generateSearchEmbedding(query);

            // Perform vector similarity search using cosine similarity
            const result = await pool.query(`
                SELECT 
                    id, title, content, context, impact_level, difficulty, cost_impact, tags,
                    (embedding <-> $1) as distance,
                    (1 - (embedding <-> $2)) as similarity
                FROM recommendations_kb 
                WHERE category = $3 
                AND (1 - (embedding <-> $4)) >= $5
                ORDER BY embedding <-> $6
                LIMIT $7
            `, [
                JSON.stringify(queryEmbedding),
                JSON.stringify(queryEmbedding),
                category,
                JSON.stringify(queryEmbedding),
                similarityThreshold,
                JSON.stringify(queryEmbedding),
                limit
            ]);

            return result.rows.map(row => ({
                id: row.id,
                title: row.title,
                content: row.content,
                context: row.context,
                impact_level: row.impact_level,
                difficulty: row.difficulty,
                cost_impact: row.cost_impact,
                tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'),
                similarity: parseFloat(row.similarity)
            }));
        } catch (error) {
            console.error('Error searching recommendations:', error);
            throw error;
        }
    }

    /**
     * Search recommendations by category and user context
     */
    async searchRecommendationsByContext(category, userContext, userEmissions, limit = 5) {
        try {
            // Create a contextual search query
            const searchQuery = `${category} carbon footprint reduction ${userContext} emissions ${userEmissions} kg CO2`;
            
            return this.searchSimilarRecommendations(searchQuery, category, limit);
        } catch (error) {
            console.error('Error searching by context:', error);
            throw error;
        }
    }

    /**
     * Search recommendations by context with debug information
     */
    async searchRecommendationsByContextWithDebug(category, userContext, userEmissions, limit = 5) {
        try {
            // Create a contextual search query
            const searchQuery = `${category} carbon footprint reduction ${userContext} emissions ${userEmissions} kg CO2`;
            
            console.log(`[DEBUG] Vector search query: "${searchQuery}"`);
            
            // Generate embedding with debug information
            const { embedding, debug } = await cohereService.generateSearchEmbeddingWithDebug(searchQuery);

            // Perform vector similarity search
            const result = await pool.query(`
                SELECT 
                    id, title, content, context, impact_level, difficulty, cost_impact, tags,
                    (embedding <-> $1) as distance,
                    (1 - (embedding <-> $2)) as similarity
                FROM recommendations_kb 
                WHERE category = $3 
                AND (1 - (embedding <-> $4)) >= 0.7
                ORDER BY embedding <-> $5
                LIMIT $6
            `, [
                JSON.stringify(embedding),
                JSON.stringify(embedding),
                category,
                JSON.stringify(embedding),
                JSON.stringify(embedding),
                limit
            ]);

            const results = result.rows.map(row => ({
                id: row.id,
                title: row.title,
                content: row.content,
                context: row.context,
                impact_level: row.impact_level,
                difficulty: row.difficulty,
                cost_impact: row.cost_impact,
                tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'),
                similarity: parseFloat(row.similarity)
            }));

            console.log(`[DEBUG] Vector search found ${results.length} results`);

            return {
                results,
                cohereDebug: debug
            };
        } catch (error) {
            console.error('Error searching by context with debug:', error);
            throw error;
        }
    }

    /**
     * Get recommendations by category with filtering
     */
    async getRecommendationsByCategory(category, filters = {}, limit = 10) {
        try {
            let query = `
                SELECT * FROM recommendations_kb 
                WHERE category = $1
            `;
            const params = [category];
            let paramCount = 1;

            // Apply filters
            if (filters.impact_level) {
                paramCount++;
                query += ` AND impact_level = $${paramCount}`;
                params.push(filters.impact_level);
            }
            if (filters.difficulty) {
                paramCount++;
                query += ` AND difficulty = $${paramCount}`;
                params.push(filters.difficulty);
            }
            if (filters.cost_impact) {
                paramCount++;
                query += ` AND cost_impact = $${paramCount}`;
                params.push(filters.cost_impact);
            }

            paramCount++;
            query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
            params.push(limit);

            const result = await pool.query(query, params);

            return result.rows.map(row => ({
                id: row.id,
                category: row.category,
                title: row.title,
                content: row.content,
                context: row.context,
                impact_level: row.impact_level,
                difficulty: row.difficulty,
                cost_impact: row.cost_impact,
                tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'),
                embedding: row.embedding ? JSON.parse(row.embedding) : null
            }));
        } catch (error) {
            console.error('Error getting recommendations by category:', error);
            throw error;
        }
    }

    /**
     * Update recommendation embedding (useful for re-indexing)
     */
    async updateRecommendationEmbedding(recommendationId) {
        try {
            // Get the recommendation
            const result = await pool.query(`
                SELECT * FROM recommendations_kb WHERE id = $1
            `, [recommendationId]);

            if (result.rows.length === 0) {
                throw new Error('Recommendation not found');
            }

            const recommendation = result.rows[0];

            // Generate new embedding
            const embedding = await cohereService.generateRecommendationEmbedding({
                title: recommendation.title,
                content: recommendation.content,
                category: recommendation.category,
                context: recommendation.context,
                tags: JSON.parse(recommendation.tags || '[]')
            });

            // Update the embedding
            await pool.query(`
                UPDATE recommendations_kb 
                SET embedding = $1, updated_at = NOW()
                WHERE id = $2
            `, [JSON.stringify(embedding), recommendationId]);
        } catch (error) {
            console.error('Error updating recommendation embedding:', error);
            throw error;
        }
    }

    /**
     * Batch store multiple recommendations
     */
    async batchStoreRecommendations(recommendations) {
        try {
            const results = [];
            
            // Process in batches to avoid rate limits
            const batchSize = 5;
            for (let i = 0; i < recommendations.length; i += batchSize) {
                const batch = recommendations.slice(i, i + batchSize);
                
                const batchPromises = batch.map(rec => this.storeRecommendation(rec));
                const batchResults = await Promise.all(batchPromises);
                
                results.push(...batchResults);
                
                // Small delay between batches
                if (i + batchSize < recommendations.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error batch storing recommendations:', error);
            throw error;
        }
    }
}

export const vectorService = new VectorService();
