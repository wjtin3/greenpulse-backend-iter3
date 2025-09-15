#!/usr/bin/env node

/**
 * Test script to verify GreenPulse backend deployment
 * Run this after deploying to Vercel to check if everything is working
 */

const BASE_URL = 'https://gp-backend-iter2.vercel.app';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    return { success: true, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing GreenPulse Backend Deployment\n');
  
  // Test 1: Basic health check
  console.log('1. Testing basic health check...');
  await testEndpoint('/health');
  
  // Test 2: Database health check
  console.log('\n2. Testing database connection...');
  await testEndpoint('/health/db');
  
  // Test 3: Travel calculator
  console.log('\n3. Testing travel calculator...');
  await testEndpoint('/api/calculate/travel', 'POST', {
    privateTransport: [{
      vehicleType: 'car',
      vehicleSize: 'small',
      fuelType: 'petrol',
      distance: 50
    }]
  });
  
  // Test 4: Household calculator
  console.log('\n4. Testing household calculator...');
  await testEndpoint('/api/calculate/household', 'POST', {
    numberOfPeople: 2,
    electricityUsage: 200,
    waterUsage: 10,
    wasteDisposal: 5
  });
  
  // Test 5: Recommendations health check
  console.log('\n5. Testing recommendations service...');
  await testEndpoint('/api/recommendations/health');
  
  // Test 6: Get emission factors
  console.log('\n6. Testing emission factors...');
  await testEndpoint('/api/emission-factors/vehicles');
  
  console.log('\n🎉 Deployment testing complete!');
  console.log('\nIf you see any ❌ errors above, check:');
  console.log('- Environment variables in Vercel dashboard');
  console.log('- Database connection string');
  console.log('- API keys for Cohere and Groq');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testEndpoint, runTests };
