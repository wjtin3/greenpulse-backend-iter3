import { cohereService } from './services/cohereService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCohereEmbeddings() {
    try {
        console.log('🧪 Testing Cohere Embeddings Service...\n');

        // Test 1: Basic embedding generation
        console.log('Test 1: Basic embedding generation');
        const testText = "Reduce carbon footprint by using public transport in Malaysia";
        const embedding = await cohereService.generateEmbedding(testText);
        console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
        console.log(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);

        // Test 2: Search query embedding
        console.log('Test 2: Search query embedding');
        const searchQuery = "How to reduce travel emissions in Kuala Lumpur";
        const searchEmbedding = await cohereService.generateSearchEmbedding(searchQuery);
        console.log(`✅ Generated search embedding with ${searchEmbedding.length} dimensions\n`);

        // Test 3: Recommendation embedding
        console.log('Test 3: Recommendation embedding');
        const recommendation = {
            title: "Use LRT and MRT for daily commute",
            content: "Malaysia's LRT and MRT systems are efficient and eco-friendly alternatives to private vehicles. They can reduce your carbon footprint by up to 80% compared to driving.",
            category: "travel",
            context: "Malaysian public transport system",
            tags: ["public transport", "LRT", "MRT", "commute", "emissions"]
        };
        const recEmbedding = await cohereService.generateRecommendationEmbedding(recommendation);
        console.log(`✅ Generated recommendation embedding with ${recEmbedding.length} dimensions\n`);

        // Test 4: Debug embedding
        console.log('Test 4: Debug embedding generation');
        const debugResult = await cohereService.generateSearchEmbeddingWithDebug("carbon footprint reduction tips");
        console.log(`✅ Debug embedding generated:`);
        console.log(`   - Model: ${debugResult.debug.model}`);
        console.log(`   - Input type: ${debugResult.debug.inputType}`);
        console.log(`   - Dimension: ${debugResult.debug.embeddingDimension}`);
        console.log(`   - Tokens used: ${debugResult.debug.tokensUsed}`);
        console.log(`   - Response time: ${debugResult.debug.responseTime}ms`);
        console.log(`   - API version: ${debugResult.debug.apiVersion}\n`);

        // Test 5: Multiple embeddings
        console.log('Test 5: Multiple embeddings generation');
        const texts = [
            "Use energy-efficient appliances",
            "Reduce water consumption",
            "Recycle and compost waste"
        ];
        const multipleEmbeddings = await cohereService.generateEmbeddings(texts);
        console.log(`✅ Generated ${multipleEmbeddings.length} embeddings`);
        multipleEmbeddings.forEach((emb, index) => {
            console.log(`   Embedding ${index + 1}: ${emb.length} dimensions`);
        });

        console.log('\n🎉 All Cohere embedding tests passed successfully!');

    } catch (error) {
        console.error('❌ Cohere embedding test failed:', error.message);
        
        if (error.message.includes('COHERE_API_KEY')) {
            console.log('\n💡 To fix this:');
            console.log('1. Get a Cohere API key from: https://cohere.ai/');
            console.log('2. Create a .env file in your project root');
            console.log('3. Add: COHERE_API_KEY=your_api_key_here');
        }
    }
}

// Run the test
testCohereEmbeddings();
