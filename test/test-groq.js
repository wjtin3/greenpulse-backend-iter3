import { groqService } from './services/groqService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testGroqService() {
    try {
        console.log('🤖 Testing Groq LLM Service...\n');

        // Test 1: Basic service test
        console.log('Test 1: Basic service test');
        const testResult = await groqService.testService();
        if (testResult.success) {
            console.log(`✅ Service test passed`);
            console.log(`Model used: ${testResult.model}`);
            console.log(`Response: ${testResult.response.substring(0, 100)}...\n`);
        } else {
            console.log(`❌ Service test failed: ${testResult.error}\n`);
            return;
        }

        // Test 2: General text generation
        console.log('Test 2: General text generation');
        const textPrompt = "Explain carbon footprint reduction in Malaysia in simple terms";
        const textResponse = await groqService.generateText(textPrompt, {
            temperature: 0.7,
            max_tokens: 200,
            systemPrompt: "You are a helpful environmental consultant."
        });
        console.log(`✅ Text generated successfully`);
        console.log(`Prompt: ${textPrompt}`);
        console.log(`Response: ${textResponse.substring(0, 150)}...\n`);

        // Test 3: Carbon footprint summary
        console.log('Test 3: Carbon footprint summary');
        const summaryData = {
            category: 'travel',
            emissions: 45.2,
            userData: {
                distance: 100,
                vehicleType: 'car',
                fuelType: 'petrol'
            }
        };
        const summary = await groqService.generateFootprintSummary(
            summaryData.category,
            summaryData.emissions,
            summaryData.userData
        );
        console.log(`✅ Summary generated successfully`);
        console.log(`Category: ${summaryData.category}`);
        console.log(`Emissions: ${summaryData.emissions} kg CO2`);
        console.log(`Summary: ${summary}\n`);

        // Test 4: Recommendations generation
        console.log('Test 4: Recommendations generation');
        const recommendationContext = {
            category: 'travel',
            userEmissions: 45.2,
            userData: {
                privateTransport: [
                    { vehicleType: 'car', distance: 100, fuelType: 'petrol' }
                ],
                publicTransport: [
                    { transportType: 'bus', distance: 30 }
                ]
            },
            similarRecommendations: [
                {
                    title: 'Use public transport',
                    content: 'Public transport reduces emissions significantly',
                    impact_level: 'high',
                    difficulty: 'easy',
                    cost_impact: 'saves_money'
                },
                {
                    title: 'Carpool with colleagues',
                    content: 'Sharing rides reduces individual emissions',
                    impact_level: 'medium',
                    difficulty: 'moderate',
                    cost_impact: 'saves_money'
                }
            ]
        };
        const recommendations = await groqService.generateRecommendations(recommendationContext);
        console.log(`✅ Recommendations generated successfully`);
        console.log(`Context: ${recommendationContext.category} - ${recommendationContext.userEmissions} kg CO2`);
        console.log(`Similar recommendations: ${recommendationContext.similarRecommendations.length}`);
        console.log(`Response length: ${recommendations.length} characters`);
        console.log(`First 200 chars: ${recommendations.substring(0, 200)}...\n`);

        // Test 5: Model configuration
        console.log('Test 5: Model configuration');
        console.log(`Current primary model: ${groqService.primaryModel}`);
        console.log(`Current backup model: ${groqService.backupModel}`);
        
        // Test updating models (just for demonstration)
        groqService.setModels('openai/gpt-oss-120b', 'openai/gpt-oss-20b');
        console.log(`✅ Models updated successfully\n`);

        console.log('🎉 All Groq LLM tests passed successfully!');

    } catch (error) {
        console.error('❌ Groq LLM test failed:', error.message);
        
        if (error.message.includes('GROQ_API_KEY')) {
            console.log('\n💡 To fix this:');
            console.log('1. Get a Groq API key from: https://console.groq.com/');
            console.log('2. Create a .env file in your project root');
            console.log('3. Add: GROQ_API_KEY=your_api_key_here');
        }
    }
}

// Run the test
testGroqService();
