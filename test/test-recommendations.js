import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'https://gp-backend-iter2.vercel.app';
const API_URL = `${BASE_URL}/api/recommendations`;

// Test data for different categories - simplified to focus on category and emissions
const testData = {
    travel: {
        category: 'travel',
        emissions: 45.2,
        // Optional calculationData for additional context
        calculationData: {
            privateTransport: [{
                vehicleType: 'car',
                distance: 50,
                fuelType: 'petrol',
                vehicleSize: 'medium'
            }],
            publicTransport: [{
                transportType: 'bus',
                distance: 20
            }]
        }
    },
    household: {
        category: 'household',
        emissions: 120.5,
        calculationData: {
            numberOfPeople: 4,
            electricityUsage: 350,
            waterUsage: 800,
            wasteDisposal: 15
        }
    },
    food: {
        category: 'food',
        emissions: 85.3,
        calculationData: {
            foodItems: [
                { foodType: 'chicken', quantity: 2 },
                { foodType: 'rice', quantity: 5 },
                { foodType: 'vegetables', quantity: 3 }
            ]
        }
    },
    shopping: {
        category: 'shopping',
        emissions: 65.8,
        calculationData: {
            categories: [
                { name: 'clothing', spending: 200 },
                { name: 'electronics', spending: 500 }
            ],
            spending: 700
        }
    }
};

// Minimal test data with just category and emissions
const minimalTestData = {
    travel: {
        category: 'travel',
        emissions: 45.2
    },
    household: {
        category: 'household',
        emissions: 120.5
    },
    food: {
        category: 'food',
        emissions: 85.3
    },
    shopping: {
        category: 'shopping',
        emissions: 65.8
    }
};

// Test functions
async function testHealthCheck() {
    console.log('\n🔍 Testing recommendation service health check...');
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Health check passed');
            console.log(`   Status: ${data.status}`);
            console.log(`   Test results: ${data.testResults} recommendations found`);
            return true;
        } else {
            console.log('❌ Health check failed');
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Health check failed with error:', error.message);
        return false;
    }
}

async function testGenerateRecommendations(category, testData) {
    console.log(`\n🔍 Testing recommendation generation for ${category}...`);
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...testData,
                debugMode: true
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`✅ ${category} recommendations generated successfully`);
            console.log(`   Session ID: ${data.sessionId}`);
            console.log(`   Summary: ${data.data.summary?.substring(0, 100)}...`);
            console.log(`   Recommendations: ${data.data.recommendations?.substring(0, 100)}...`);
            console.log(`   Similar recommendations found: ${data.data.similarRecommendations?.length || 0}`);
            
            if (data.data.debug) {
                console.log(`   Debug info available: ${Object.keys(data.data.debug).join(', ')}`);
            }
            
            return true;
        } else {
            console.log(`❌ ${category} recommendation generation failed`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            console.log(`   Message: ${data.message || 'No message'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${category} recommendation generation failed with error:`, error.message);
        return false;
    }
}

async function testMinimalRecommendations(category, testData) {
    console.log(`\n🔍 Testing minimal recommendation generation for ${category} (category + emissions only)...`);
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...testData,
                debugMode: false
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`✅ ${category} minimal recommendations generated successfully`);
            console.log(`   Session ID: ${data.sessionId}`);
            console.log(`   Summary: ${data.data.summary?.substring(0, 100)}...`);
            console.log(`   Recommendations: ${data.data.recommendations?.substring(0, 100)}...`);
            console.log(`   Similar recommendations found: ${data.data.similarRecommendations?.length || 0}`);
            
            return true;
        } else {
            console.log(`❌ ${category} minimal recommendation generation failed`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            console.log(`   Message: ${data.message || 'No message'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${category} minimal recommendation generation failed with error:`, error.message);
        return false;
    }
}

async function testSearchRecommendations() {
    console.log('\n🔍 Testing recommendation search...');
    try {
        const response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: 'reduce car emissions',
                category: 'travel',
                limit: 3,
                similarityThreshold: 0.7
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Recommendation search successful');
            console.log(`   Found ${data.count} results`);
            console.log(`   Query: ${data.query}`);
            console.log(`   Category: ${data.category}`);
            return true;
        } else {
            console.log('❌ Recommendation search failed');
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Recommendation search failed with error:', error.message);
        return false;
    }
}

async function testGetRecommendationsByCategory() {
    console.log('\n🔍 Testing get recommendations by category...');
    try {
        const response = await fetch(`${API_URL}/category/travel?limit=3`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Get recommendations by category successful');
            console.log(`   Found ${data.data.length} travel recommendations`);
            return true;
        } else {
            console.log('❌ Get recommendations by category failed');
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Get recommendations by category failed with error:', error.message);
        return false;
    }
}

async function testGetPopularRecommendations() {
    console.log('\n🔍 Testing get popular recommendations...');
    try {
        const response = await fetch(`${API_URL}/popular/travel?limit=3`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Get popular recommendations successful');
            console.log(`   Found ${data.data.length} popular travel recommendations`);
            return true;
        } else {
            console.log('❌ Get popular recommendations failed');
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Get popular recommendations failed with error:', error.message);
        return false;
    }
}

async function testGetEmissionFactors() {
    console.log('\n🔍 Testing get emission factors...');
    try {
        const response = await fetch(`${API_URL}/emission-factors/travel`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Get emission factors successful');
            console.log(`   Found ${data.data.length} travel emission factors`);
            return true;
        } else {
            console.log('❌ Get emission factors failed');
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Get emission factors failed with error:', error.message);
        return false;
    }
}

async function testErrorHandling() {
    console.log('\n🔍 Testing error handling...');
    
    // Test missing required fields
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category: 'travel'
                // Missing emissions
            })
        });
        
        const data = await response.json();
        
        if (response.status === 400 && data.error) {
            console.log('✅ Error handling for missing emissions works');
            console.log(`   Error: ${data.error}`);
        } else {
            console.log('❌ Error handling for missing emissions failed');
        }
    } catch (error) {
        console.log('❌ Error handling test failed with error:', error.message);
    }
    
    // Test missing category
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                emissions: 50
                // Missing category
            })
        });
        
        const data = await response.json();
        
        if (response.status === 400 && data.error) {
            console.log('✅ Error handling for missing category works');
            console.log(`   Error: ${data.error}`);
        } else {
            console.log('❌ Error handling for missing category failed');
        }
    } catch (error) {
        console.log('❌ Error handling test failed with error:', error.message);
    }
    
    // Test invalid category
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category: 'invalid',
                emissions: 50
            })
        });
        
        const data = await response.json();
        
        if (response.status === 400 && data.error) {
            console.log('✅ Error handling for invalid category works');
            console.log(`   Error: ${data.error}`);
        } else {
            console.log('❌ Error handling for invalid category failed');
        }
    } catch (error) {
        console.log('❌ Error handling test failed with error:', error.message);
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Recommendation Feature Tests');
    console.log(`📍 Testing against: ${BASE_URL}`);
    console.log('=' .repeat(60));
    
    const results = {
        healthCheck: false,
        generateTravel: false,
        generateHousehold: false,
        generateFood: false,
        generateShopping: false,
        minimalTravel: false,
        minimalHousehold: false,
        minimalFood: false,
        minimalShopping: false,
        search: false,
        getByCategory: false,
        getPopular: false,
        getEmissionFactors: false,
        errorHandling: false
    };
    
    // Run all tests
    results.healthCheck = await testHealthCheck();
    
    if (results.healthCheck) {
        // Test with full calculation data
        results.generateTravel = await testGenerateRecommendations('travel', testData.travel);
        results.generateHousehold = await testGenerateRecommendations('household', testData.household);
        results.generateFood = await testGenerateRecommendations('food', testData.food);
        results.generateShopping = await testGenerateRecommendations('shopping', testData.shopping);
        
        // Test with minimal data (category + emissions only)
        results.minimalTravel = await testMinimalRecommendations('travel', minimalTestData.travel);
        results.minimalHousehold = await testMinimalRecommendations('household', minimalTestData.household);
        results.minimalFood = await testMinimalRecommendations('food', minimalTestData.food);
        results.minimalShopping = await testMinimalRecommendations('shopping', minimalTestData.shopping);
        
        results.search = await testSearchRecommendations();
        results.getByCategory = await testGetRecommendationsByCategory();
        results.getPopular = await testGetPopularRecommendations();
        results.getEmissionFactors = await testGetEmissionFactors();
    }
    
    results.errorHandling = await testErrorHandling();
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    console.log('\nDetailed Results:');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${test}`);
    });
    
    if (passed === total) {
        console.log('\n🎉 All tests passed! Recommendation feature is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
    
    return results;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { runTests, testData, minimalTestData };
