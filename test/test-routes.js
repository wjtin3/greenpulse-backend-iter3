#!/usr/bin/env node

/**
 * Test script to verify all routes are working
 */

const BASE_URL = 'https://gp-backend-iter2.vercel.app';

const routes = [
  { path: '/health', method: 'GET', description: 'Basic health check' },
  { path: '/health/db', method: 'GET', description: 'Database health check' },
  { path: '/api/calculate/travel', method: 'POST', description: 'Travel calculator', body: {
    privateTransport: [{
      vehicleType: 'car',
      vehicleSize: 'small',
      fuelType: 'petrol',
      distance: 50
    }]
  }},
  { path: '/api/calculate/household', method: 'POST', description: 'Household calculator', body: {
    numberOfPeople: 2,
    electricityUsage: 200,
    waterUsage: 10,
    wasteDisposal: 5
  }},
  { path: '/api/emission-factors/vehicles', method: 'GET', description: 'Vehicle emission factors' },
  { path: '/api/recommendations/health', method: 'GET', description: 'Recommendations health check' }
];

async function testRoute(route) {
  try {
    const options = {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (route.body) {
      options.body = JSON.stringify(route.body);
    }
    
    const response = await fetch(`${BASE_URL}${route.path}`, options);
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${route.method} ${route.path} - ${route.description}`);
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ ${route.method} ${route.path} - ${route.description}`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runRouteTests() {
  console.log('🧪 Testing GreenPulse Backend Routes\n');
  
  let successCount = 0;
  let totalCount = routes.length;
  
  for (const route of routes) {
    const result = await testRoute(route);
    if (result.success) successCount++;
    console.log(''); // Add spacing
  }
  
  console.log(`📊 Results: ${successCount}/${totalCount} routes working`);
  
  if (successCount === totalCount) {
    console.log('🎉 All routes are working correctly!');
  } else {
    console.log('⚠️  Some routes are not working. Check the errors above.');
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRouteTests().catch(console.error);
}

export { testRoute, runRouteTests };
