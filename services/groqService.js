import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

export class GroqLLMService {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY environment variable is required');
        }
        
        this.client = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
        
        // Model configuration with fallback support
        this.primaryModel = 'openai/gpt-oss-120b';
        this.backupModel = 'openai/gpt-oss-20b';
        
        console.log(`[INFO] Groq service initialized - Primary: ${this.primaryModel}, Backup: ${this.backupModel}`);
    }

    /**
     * Update model configuration
     */
    setModels(primaryModel, backupModel) {
        this.primaryModel = primaryModel;
        this.backupModel = backupModel;
        console.log(`[INFO] Updated models - Primary: ${this.primaryModel}, Backup: ${this.backupModel}`);
    }

    /**
     * Generate personalized recommendations using RAG context
     */
    async generateRecommendations(context) {
        const systemPrompt = this.buildSystemPrompt(context.category);
        const userPrompt = this.buildUserPrompt(context);

        return await this.callGroqWithFallback({
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500, // Reduced for shorter, more focused responses
            top_p: 0.9,
        });
    }

    /**
     * Generate a summary of carbon footprint results
     */
    async generateFootprintSummary(category, emissions, userData) {
        const systemPrompt = `You are a carbon footprint analyst. Provide a brief, informative summary of carbon footprint results in Malaysian context.`;
        
        const userPrompt = `Category: ${category}
Total emissions: ${emissions.toFixed(2)} kg CO2
User data: ${JSON.stringify(userData, null, 2)}

Provide a 2-3 sentence summary that:
1. Explains what this emission level means
2. Compares it to Malaysian averages if relevant
3. Gives a brief context about the impact`;

        try {
            return await this.callGroqWithFallback({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.5,
                max_tokens: 200,
            });
        } catch (error) {
            console.error('Error generating summary:', error);
            return 'Summary generation failed.';
        }
    }

    /**
     * Generate general text using Groq LLM
     */
    async generateText(prompt, options = {}) {
        const {
            temperature = 0.7,
            max_tokens = 3000,
            top_p = 0.9,
            systemPrompt = null
        } = options;

        const messages = [];
        
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        
        messages.push({ role: 'user', content: prompt });

        return await this.callGroqWithFallback({
            messages,
            temperature,
            max_tokens,
            top_p,
        });
    }

    /**
     * Call Groq API with fallback model support
     */
    async callGroqWithFallback(requestParams) {
        const startTime = Date.now();
        let modelUsed = this.primaryModel;
        let fallbackUsed = false;

        try {
            // Try primary model first
            console.log(`[INFO] Attempting to use primary model: ${this.primaryModel}`);
            console.log(`[DEBUG] Request params:`, JSON.stringify(requestParams, null, 2));
            
            const response = await this.client.chat.completions.create({
                ...requestParams,
                model: this.primaryModel,
            });

            const responseTime = Date.now() - startTime;
            console.log(`[DEBUG] Groq API Response - Model: ${this.primaryModel}, Tokens: ${response.usage?.total_tokens || 'N/A'}, Time: ${responseTime}ms`);
            console.log(`[DEBUG] Response length:`, response.choices[0]?.message?.content?.length || 0);
            console.log(`[DEBUG] Response finish reason:`, response.choices[0]?.finish_reason || 'N/A');

            return response.choices[0]?.message?.content || 'Unable to generate response.';
        } catch (error) {
            console.warn(`[WARN] Primary model ${this.primaryModel} failed, trying backup model: ${this.backupModel}`);
            console.error('Primary model error:', error);
            fallbackUsed = true;
            modelUsed = this.backupModel;

            try {
                // Try backup model
                const response = await this.client.chat.completions.create({
                    ...requestParams,
                    model: this.backupModel,
                });

                const responseTime = Date.now() - startTime;
                console.log(`[DEBUG] Groq API Response (Fallback) - Model: ${this.backupModel}, Tokens: ${response.usage?.total_tokens || 'N/A'}, Time: ${responseTime}ms`);
                console.log(`[DEBUG] Fallback response length:`, response.choices[0]?.message?.content?.length || 0);
                console.log(`[DEBUG] Fallback response finish reason:`, response.choices[0]?.finish_reason || 'N/A');

                return response.choices[0]?.message?.content || 'Unable to generate response.';
            } catch (backupError) {
                console.error('Backup model also failed:', backupError);
                throw new Error(`Both models failed. Primary: ${error instanceof Error ? error.message : 'Unknown error'}. Backup: ${backupError instanceof Error ? backupError.message : 'Unknown error'}`);
            }
        }
    }

    /**
     * Build system prompt based on category
     */
    buildSystemPrompt(category) {
        const basePrompt = `You are a friendly carbon footprint expert who helps Malaysian users reduce their emissions.
        
        Your style:
        - Be encouraging and positive
        - Use simple, clear language
        - Keep responses short and practical
        - Focus on what people can do today
        - Include Malaysian context and local tips
        - Use emojis to make it friendly
        - ALWAYS limit to exactly 2 recommendations
        - No complex tables or formatting - just simple, actionable advice`;

        const categorySpecificPrompts = {
            travel: `
            Travel-specific guidance:
            - Consider Malaysian public transport options (LRT, MRT, KTM, buses)
            - Mention ride-sharing and carpooling options
            - Discuss fuel-efficient driving techniques
            - Consider local traffic patterns and peak hours
            - Suggest walking/cycling for short distances`,
            
            household: `
            Household-specific guidance:
            - Consider Malaysian climate (tropical, high humidity)
            - Mention local utility providers (TNB, water authorities)
            - Discuss energy-efficient appliances available in Malaysia
            - Consider local waste management systems
            - Suggest water-saving techniques for tropical climate`,
            
            food: `
            Food-specific guidance:
            - Consider Malaysian cuisine and local ingredients
            - Mention local food production and seasonal availability
            - Discuss traditional cooking methods vs modern alternatives
            - Consider local food waste reduction practices
            - Suggest local plant-based alternatives`,
            
            shopping: `
            Shopping-specific guidance:
            - Consider local manufacturing and imports
            - Mention local brands and sustainable alternatives
            - Discuss repair and reuse culture in Malaysia
            - Consider local e-commerce and delivery options
            - Suggest local second-hand markets and platforms`
        };

        return basePrompt + (categorySpecificPrompts[category] || '');
    }

    /**
     * Build user prompt with context
     */
    buildUserPrompt(context) {
        const { category, userEmissions, userData, similarRecommendations } = context;

        let prompt = `Based on the user's ${category} carbon footprint calculation:\n\n`;
        prompt += `Total emissions: ${userEmissions.toFixed(2)} kg CO2\n\n`;
        
        // Add user data context
        prompt += `User data: ${JSON.stringify(userData, null, 2)}\n\n`;
        
        // Add similar recommendations as context
        if (similarRecommendations && similarRecommendations.length > 0) {
            prompt += `Similar recommendations from our knowledge base:\n`;
            similarRecommendations.forEach((rec, index) => {
                prompt += `${index + 1}. ${rec.title}\n`;
                prompt += `   Impact: ${rec.impact_level}, Difficulty: ${rec.difficulty}, Cost: ${rec.cost_impact}\n`;
                prompt += `   ${rec.content}\n\n`;
            });
        }

        prompt += `Please provide exactly 2 simple, actionable recommendations to help reduce their ${category} carbon footprint.
        
        Write in a friendly, conversational tone. Keep it short and practical. For each recommendation, include:
        - What to do (simple action)
        - Why it helps (brief benefit)
        - How to start (1-2 easy steps)
        - Malaysian context (local tip)
        
        Format as a simple list with emojis. No tables, no complex formatting. Just friendly, actionable advice.
        
        Example format:
        🌱 **Recommendation 1**: [Simple action]
        - Why: [Brief benefit]
        - How: [1-2 easy steps]
        - Local tip: [Malaysian context]
        
        🚀 **Recommendation 2**: [Simple action]
        - Why: [Brief benefit]
        - How: [1-2 easy steps]
        - Local tip: [Malaysian context]
        
        Keep it under 200 words total. Focus on what they can do today!`;

        return prompt;
    }

    /**
     * Test the Groq service with a simple prompt
     */
    async testService() {
        try {
            const testPrompt = "Hello! Can you tell me about carbon footprint reduction in Malaysia?";
            const response = await this.generateText(testPrompt, {
                temperature: 0.7,
                max_tokens: 200,
                systemPrompt: "You are a helpful assistant specializing in environmental topics."
            });
            
            return {
                success: true,
                response: response,
                model: this.primaryModel
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                model: this.primaryModel
            };
        }
    }
}

export const groqService = new GroqLLMService();
