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
            max_tokens: 300, // Further reduced for very concise responses
            top_p: 0.9,
        });
    }

    /**
     * Generate a summary of carbon footprint results
     */
    async generateFootprintSummary(category, emissions, userData) {
        console.log(`[INFO] Generating summary for category: ${category}, emissions: ${emissions} kg CO2`);
        
        try {
            const prompt = `Write a 2-sentence summary about this carbon footprint: ${category} category, ${emissions.toFixed(2)} kg CO2 emissions. Explain what this means and compare to Malaysian averages.`;
            
            console.log(`[DEBUG] Using generateText function for summary generation`);
            console.log(`[DEBUG] Summary prompt: ${prompt}`);
            
            const result = await this.generateText(prompt, {
                systemPrompt: "You are a carbon footprint analyst.",
                temperature: 0.7,
                max_tokens: 500
            });
            
            console.log(`[INFO] Summary generation completed - Result length: ${result.length} chars`);
            console.log(`[DEBUG] Summary result preview: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
            
            return result;
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
            const responseContent = response.choices[0]?.message?.content || '';
            const responseLength = responseContent.length;
            const finishReason = response.choices[0]?.finish_reason || 'N/A';
            const totalTokens = response.usage?.total_tokens || 'N/A';
            const promptTokens = response.usage?.prompt_tokens || 'N/A';
            const completionTokens = response.usage?.completion_tokens || 'N/A';
            
            console.log(`[DEBUG] Groq API Response - Model: ${this.primaryModel}, Time: ${responseTime}ms`);
            console.log(`[DEBUG] Token Usage - Total: ${totalTokens}, Prompt: ${promptTokens}, Completion: ${completionTokens}`);
            console.log(`[DEBUG] Response length: ${responseLength} characters`);
            console.log(`[DEBUG] Response finish reason: ${finishReason}`);
            console.log(`[DEBUG] Request max_tokens: ${requestParams.max_tokens}`);
            console.log(`[DEBUG] Request temperature: ${requestParams.temperature}`);
            
            // Log the actual response content for debugging
            if (responseContent) {
                console.log(`[DEBUG] Response content preview (first 200 chars): ${responseContent.substring(0, 200)}${responseLength > 200 ? '...' : ''}`);
                console.log(`[DEBUG] Response content preview (last 100 chars): ${responseLength > 100 ? '...' : ''}${responseContent.substring(Math.max(0, responseLength - 100))}`);
            } else {
                console.log(`[DEBUG] Response content: EMPTY`);
            }
            
            // Check for truncation indicators
            if (finishReason === 'length') {
                console.log(`[WARN] Response was truncated due to max_tokens limit (${requestParams.max_tokens})`);
            }
            if (responseLength === 0) {
                console.log(`[ERROR] Empty response received from Groq API`);
            }

            return responseContent || 'Unable to generate response.';
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
                const responseContent = response.choices[0]?.message?.content || '';
                const responseLength = responseContent.length;
                const finishReason = response.choices[0]?.finish_reason || 'N/A';
                const totalTokens = response.usage?.total_tokens || 'N/A';
                const promptTokens = response.usage?.prompt_tokens || 'N/A';
                const completionTokens = response.usage?.completion_tokens || 'N/A';
                
                console.log(`[DEBUG] Groq API Response (Fallback) - Model: ${this.backupModel}, Time: ${responseTime}ms`);
                console.log(`[DEBUG] Fallback Token Usage - Total: ${totalTokens}, Prompt: ${promptTokens}, Completion: ${completionTokens}`);
                console.log(`[DEBUG] Fallback response length: ${responseLength} characters`);
                console.log(`[DEBUG] Fallback response finish reason: ${finishReason}`);
                console.log(`[DEBUG] Fallback request max_tokens: ${requestParams.max_tokens}`);
                console.log(`[DEBUG] Fallback request temperature: ${requestParams.temperature}`);
                
                // Log the actual response content for debugging
                if (responseContent) {
                    console.log(`[DEBUG] Fallback response content preview (first 200 chars): ${responseContent.substring(0, 200)}${responseLength > 200 ? '...' : ''}`);
                    console.log(`[DEBUG] Fallback response content preview (last 100 chars): ${responseLength > 100 ? '...' : ''}${responseContent.substring(Math.max(0, responseLength - 100))}`);
                } else {
                    console.log(`[DEBUG] Fallback response content: EMPTY`);
                }
                
                // Check for truncation indicators
                if (finishReason === 'length') {
                    console.log(`[WARN] Fallback response was truncated due to max_tokens limit (${requestParams.max_tokens})`);
                }
                if (responseLength === 0) {
                    console.log(`[ERROR] Empty fallback response received from Groq API`);
                }

                return responseContent || 'Unable to generate response.';
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
        - Keep responses extremely short and practical
        - Focus on what people can do today
        - Include Malaysian context and local tips
        - ALWAYS provide exactly 2 recommendations + 1 summary
        - Each recommendation should be 1-2 sentences maximum
        - Summary should summarize the recommendations, not emission levels
        - Focus on the most impactful and practical suggestions
        - Avoid duplicate or similar recommendations
        - Total response under 200 words
        - Be direct and actionable - no fluff`;

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

        prompt += `Provide exactly 2 concise recommendations and a brief summary. Keep everything short and to the point.

        Format your response as:
        
        **SUMMARY**
        [2-3 sentences summarizing the key benefits of both recommendations and their combined impact]
        
        **RECOMMENDATION 1**
        [One clear action in 1-2 sentences]
        
        **RECOMMENDATION 2** 
        [One clear action in 1-2 sentences]
        
        Requirements:
        - Each recommendation should be 1-2 sentences maximum
        - Focus on the most impactful actions
        - Include Malaysian context where relevant
        - Summary should focus on the recommendations, not emission levels
        - Total response under 200 words
        - Be direct and actionable
        - No bullet points or complex formatting`;

        return prompt;
    }

    /**
     * Build summary prompt with context
     */
    buildSummaryPrompt(context) {
        const { category, userEmissions, userData } = context;

        let prompt = `Based on the user's ${category} carbon footprint calculation:\n\n`;
        prompt += `Total emissions: ${userEmissions.toFixed(2)} kg CO2\n\n`;
        
        // Add user data context
        prompt += `User data: ${JSON.stringify(userData, null, 2)}\n\n`;

        prompt += `Please provide a brief 2-3 sentence summary that:
        1. Explains what this emission level means
        2. Compares it to Malaysian averages if relevant
        3. Gives a brief context about the impact
        
        Keep it concise and informative. Focus on Malaysian context.`;

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
                max_tokens: 500,
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
