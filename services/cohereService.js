import { CohereClient } from 'cohere-ai';
import dotenv from 'dotenv';

dotenv.config();

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || '',
});

export class CohereEmbeddingService {
    constructor() {
        if (!process.env.COHERE_API_KEY) {
            throw new Error('COHERE_API_KEY environment variable is required');
        }
        this.client = cohere;
    }

    /**
     * Generate embeddings for text using Cohere's embed model
     */
    async generateEmbedding(text) {
        try {
            const response = await this.client.embed({
                texts: [text],
                model: 'embed-multilingual-v3.0', // Best for multilingual content including Malay
                inputType: 'search_document', // For storing documents
            });

            if (response.embeddings && Array.isArray(response.embeddings) && response.embeddings.length > 0) {
                return response.embeddings[0];
            }
            
            throw new Error('No embeddings returned from Cohere');
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate embeddings for multiple texts
     */
    async generateEmbeddings(texts) {
        try {
            const response = await this.client.embed({
                texts,
                model: 'embed-multilingual-v3.0',
                inputType: 'search_document',
            });

            if (response.embeddings && Array.isArray(response.embeddings)) {
                return response.embeddings;
            }
            
            throw new Error('No embeddings returned from Cohere');
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate search query embedding
     */
    async generateSearchEmbedding(query) {
        try {
            const response = await this.client.embed({
                texts: [query],
                model: 'embed-multilingual-v3.0',
                inputType: 'search_query', // For search queries
            });

            if (response.embeddings && Array.isArray(response.embeddings) && response.embeddings.length > 0) {
                return response.embeddings[0];
            }
            
            throw new Error('No search embedding returned from Cohere');
        } catch (error) {
            console.error('Error generating search embedding:', error);
            throw new Error(`Failed to generate search embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate embeddings for recommendation content
     */
    async generateRecommendationEmbedding(recommendation) {
        // Combine all text fields for comprehensive embedding
        const combinedText = [
            recommendation.title,
            recommendation.content,
            recommendation.category,
            recommendation.context || '',
            recommendation.tags?.join(' ') || ''
        ].filter(Boolean).join(' ');

        return this.generateEmbedding(combinedText);
    }

    /**
     * Generate search query embedding with debug information
     */
    async generateSearchEmbeddingWithDebug(query) {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();

        try {
            console.log(`[DEBUG] Generating Cohere embedding for query: "${query}"`);
            
            const response = await this.client.embed({
                texts: [query],
                model: 'embed-multilingual-v3.0',
                inputType: 'search_query',
            });

            const responseTime = Date.now() - startTime;

            if (response.embeddings && Array.isArray(response.embeddings) && response.embeddings.length > 0) {
                const embedding = response.embeddings[0];
                
                const debugInfo = {
                    inputText: query,
                    model: 'embed-multilingual-v3.0',
                    inputType: 'search_query',
                    embeddingVector: embedding,
                    embeddingDimension: embedding.length,
                    tokensUsed: response.meta?.billedUnits?.inputTokens || 0,
                    responseTime,
                    timestamp,
                    apiVersion: response.meta?.apiVersion?.version || 'unknown'
                };

                console.log(`[DEBUG] Cohere embedding generated - Dimension: ${embedding.length}, Tokens: ${debugInfo.tokensUsed}, Time: ${responseTime}ms`);
                console.log(`[DEBUG] Embedding vector (first 10 values): [${embedding.slice(0, 10).map((v) => v.toFixed(4)).join(', ')}...]`);

                return {
                    embedding,
                    debug: debugInfo
                };
            }
            
            throw new Error('No search embedding returned from Cohere');
        } catch (error) {
            console.error('Error generating search embedding with debug:', error);
            throw new Error(`Failed to generate search embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate embedding with debug information
     */
    async generateEmbeddingWithDebug(text, inputType = 'search_document') {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();

        try {
            console.log(`[DEBUG] Generating Cohere embedding for text: "${text.substring(0, 100)}..."`);
            
            const response = await this.client.embed({
                texts: [text],
                model: 'embed-multilingual-v3.0',
                inputType,
            });

            const responseTime = Date.now() - startTime;

            if (response.embeddings && Array.isArray(response.embeddings) && response.embeddings.length > 0) {
                const embedding = response.embeddings[0];
                
                const debugInfo = {
                    inputText: text,
                    model: 'embed-multilingual-v3.0',
                    inputType,
                    embeddingVector: embedding,
                    embeddingDimension: embedding.length,
                    tokensUsed: response.meta?.billedUnits?.inputTokens || 0,
                    responseTime,
                    timestamp,
                    apiVersion: response.meta?.apiVersion?.version || 'unknown'
                };

                console.log(`[DEBUG] Cohere embedding generated - Dimension: ${embedding.length}, Tokens: ${debugInfo.tokensUsed}, Time: ${responseTime}ms`);
                console.log(`[DEBUG] Embedding vector (first 10 values): [${embedding.slice(0, 10).map((v) => v.toFixed(4)).join(', ')}...]`);

                return {
                    embedding,
                    debug: debugInfo
                };
            }
            
            throw new Error('No embeddings returned from Cohere');
        } catch (error) {
            console.error('Error generating embedding with debug:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const cohereService = new CohereEmbeddingService();
