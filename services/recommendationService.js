import { vectorService } from './vectorService.js';
import { groqService } from './groqService.js';
import { cohereService } from './cohereService.js';
import { pool } from '../config/database.js';

export class RecommendationService {
    /**
     * Generate personalized recommendations for a carbon footprint calculation
     */
    async generateRecommendations(footprintData) {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        
        try {
            const { category, totalEmissions, calculationData, sessionId, debugMode } = footprintData;

            // Store the calculation for future reference
            await this.storeCalculation(footprintData);

            // Build user context for vector search
            const userContext = this.buildUserContext(category, calculationData, totalEmissions);
            console.log(`[DEBUG] User context: ${userContext}`);

            // Search for similar recommendations using vector similarity
            let similarRecommendations;
            let cohereDebug;

            if (debugMode) {
                // Use debug-enabled search to get Cohere debug information
                const searchResult = await vectorService.searchRecommendationsByContextWithDebug(
                    category,
                    userContext,
                    totalEmissions,
                    5
                );
                similarRecommendations = searchResult.results;
                cohereDebug = searchResult.cohereDebug;
            } else {
                // Use regular search for better performance
                similarRecommendations = await vectorService.searchRecommendationsByContext(
                    category,
                    userContext,
                    totalEmissions,
                    5
                );
            }

            console.log(`[DEBUG] Found ${similarRecommendations.length} similar recommendations`);
            similarRecommendations.forEach((rec, index) => {
                console.log(`[DEBUG] Similar recommendation ${index + 1}: ${rec.title} (similarity: ${rec.similarity})`);
            });

            // Generate summary using Groq
            const summary = await groqService.generateFootprintSummary(
                category,
                totalEmissions,
                calculationData
            );

            // Generate personalized recommendations using RAG
            const recommendationContext = {
                category,
                userEmissions: totalEmissions,
                userData: calculationData,
                similarRecommendations: similarRecommendations.map(rec => ({
                    title: rec.title,
                    content: rec.content,
                    impact_level: rec.impact_level,
                    difficulty: rec.difficulty,
                    cost_impact: rec.cost_impact
                }))
            };

            const recommendations = await groqService.generateRecommendations(recommendationContext);

            // Parse the recommendations to separate user-friendly content from table
            const { userFriendlyContent, tableContent } = this.parseRecommendationResponse(recommendations);

            const processingTime = Date.now() - startTime;

            const response = {
                summary,
                recommendations,
                userFriendlyRecommendations: userFriendlyContent,
                comparisonTable: tableContent,
                similarRecommendations,
                sessionId,
                category,
                totalEmissions
            };

            // Only include debug information if debug mode is enabled
            if (debugMode) {
                response.debug = {
                    userContext,
                    embeddingGenerated: true, // We assume this worked if we got results
                    vectorSearchResults: similarRecommendations,
                    groqModelsUsed: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'], // From groqService
                    processingTime,
                    timestamp,
                    cohereDebug
                };
            }

            return response;
        } catch (error) {
            console.error('Error generating recommendations:', error);
            throw error;
        }
    }

    /**
     * Store user calculation for analytics and future recommendations
     * DISABLED - No user tracking
     */
    async storeCalculation(footprintData) {
        // User tracking disabled - no data stored
        console.log('User tracking disabled - calculation not stored');
    }

    /**
     * Parse recommendation response to separate user-friendly content from table
     */
    parseRecommendationResponse(recommendations) {
        try {
            // Split by sections
            const sections = recommendations.split(/##\s*(User-Friendly Recommendations|Comparison Table)/i);
            
            let userFriendlyContent = '';
            let tableContent = '';
            
            // Find the user-friendly section
            const userFriendlyIndex = sections.findIndex(section => 
                section.toLowerCase().includes('user-friendly recommendations')
            );
            if (userFriendlyIndex !== -1 && userFriendlyIndex + 1 < sections.length) {
                userFriendlyContent = sections[userFriendlyIndex + 1].trim();
            }
            
            // Find the comparison table section
            const tableIndex = sections.findIndex(section => 
                section.toLowerCase().includes('comparison table')
            );
            if (tableIndex !== -1 && tableIndex + 1 < sections.length) {
                tableContent = sections[tableIndex + 1].trim();
            }
            
            // Fallback: if sections aren't found, try to extract table from the content
            if (!tableContent && recommendations.includes('|')) {
                const lines = recommendations.split('\n');
                const tableLines = [];
                let inTable = false;
                
                for (const line of lines) {
                    if (line.includes('|') && line.trim().length > 0) {
                        inTable = true;
                        tableLines.push(line);
                    } else if (inTable && line.trim().length === 0) {
                        break;
                    }
                }
                
                if (tableLines.length > 0) {
                    tableContent = tableLines.join('\n');
                    // Remove table from user-friendly content
                    userFriendlyContent = recommendations.replace(tableContent, '').trim();
                }
            }
            
            // If no sections found, use the original content for user-friendly
            if (!userFriendlyContent) {
                userFriendlyContent = recommendations;
            }
            
            return {
                userFriendlyContent,
                tableContent
            };
        } catch (error) {
            console.error('Error parsing recommendation response:', error);
            // Fallback to original content
            return {
                userFriendlyContent: recommendations,
                tableContent: ''
            };
        }
    }

    /**
     * Build user context string for vector search
     */
    buildUserContext(category, calculationData, totalEmissions) {
        // Start with emissions as the primary context
        const baseContext = `${category} emissions: ${totalEmissions} kg CO2`;
        
        // Add detailed context if calculationData is available
        let detailedContext = '';
        switch (category) {
            case 'travel':
                detailedContext = this.buildTravelContext(calculationData);
                break;
            case 'household':
                detailedContext = this.buildHouseholdContext(calculationData);
                break;
            case 'food':
                detailedContext = this.buildFoodContext(calculationData);
                break;
            case 'shopping':
                detailedContext = this.buildShoppingContext(calculationData);
                break;
            default:
                detailedContext = Object.keys(calculationData).length > 0 ? JSON.stringify(calculationData) : '';
        }
        
        // Combine base context with detailed context
        return detailedContext ? `${baseContext}, ${detailedContext}` : baseContext;
    }

    buildTravelContext(data) {
        const context = [];
        if (data.privateTransport) {
            context.push(`private transport: ${data.privateTransport.vehicleType || 'car'}`);
            if (data.privateTransport.distance) context.push(`distance: ${data.privateTransport.distance}km`);
        }
        if (data.publicTransport) {
            context.push(`public transport: ${data.publicTransport.mode || 'bus'}`);
            if (data.publicTransport.distance) context.push(`distance: ${data.publicTransport.distance}km`);
        }
        return context.join(', ');
    }

    buildHouseholdContext(data) {
        const context = [];
        if (data.householdSize) context.push(`household size: ${data.householdSize} people`);
        if (data.electricityUsage) context.push(`electricity: ${data.electricityUsage}kWh/month`);
        if (data.waterUsage) context.push(`water: ${data.waterUsage}L/month`);
        if (data.wasteDisposal) context.push(`waste: ${data.wasteDisposal}kg/week`);
        return context.join(', ');
    }

    buildFoodContext(data) {
        const context = [];
        if (data.dietType) context.push(`diet: ${data.dietType}`);
        if (data.foodItems) {
            const items = data.foodItems.map(item => item.name || item.type).join(', ');
            context.push(`food items: ${items}`);
        }
        return context.join(', ');
    }

    buildShoppingContext(data) {
        const context = [];
        if (data.categories) {
            const categories = data.categories.map(cat => cat.name || cat.type).join(', ');
            context.push(`shopping categories: ${categories}`);
        }
        if (data.spending) context.push(`monthly spending: RM${data.spending}`);
        return context.join(', ');
    }

    /**
     * Get emission factors for a specific category
     */
    async getEmissionFactors(category, subcategory) {
        try {
            let query = `
                SELECT * FROM carbon_emission_factors 
                WHERE category = $1
                ORDER BY name
            `;
            const params = [category];

            if (subcategory) {
                query = query.replace('ORDER BY name', 'AND subcategory = $2 ORDER BY name');
                params.push(subcategory);
            }

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error getting emission factors:', error);
            throw error;
        }
    }

    /**
     * Track recommendation interaction for analytics
     * DISABLED - No user tracking
     */
    async trackInteraction(sessionId, recommendationId, interactionType) {
        // User tracking disabled - no data stored
        console.log('User tracking disabled - interaction not tracked');
    }

    /**
     * Get popular recommendations by category
     * DISABLED - No user tracking, returns random recommendations instead
     */
    async getPopularRecommendations(category, limit = 5) {
        try {
            // Since we don't track interactions, just return random recommendations
            const result = await pool.query(`
                SELECT 
                    id, title, content, context, impact_level, difficulty, cost_impact, tags
                FROM recommendations_kb 
                WHERE category = $1
                ORDER BY RANDOM()
                LIMIT $2
            `, [category, limit]);

            return result.rows.map(row => ({
                id: row.id,
                title: row.title,
                content: row.content,
                context: row.context,
                impact_level: row.impact_level,
                difficulty: row.difficulty,
                cost_impact: row.cost_impact,
                tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : []),
                similarity: 1.0 // Random recommendations get high similarity
            }));
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }
}

export const recommendationService = new RecommendationService();
