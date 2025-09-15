#!/usr/bin/env node

/**
 * Comprehensive test script for Travel Calculator API
 * Tests all travel calculator endpoints and scenarios
 */

const BASE_URL = 'http://localhost:3001/api';

// Test data for travel calculator
const testData = {
  // Private transport only
  privateTransportOnly: {
    privateTransport: [
      {
        vehicleType: "car",
        vehicleSize: "small",
        fuelType: "petrol",
        distance: 50
      }
    ]
  },
  
  // Public transport only
  publicTransportOnly: {
    publicTransport: [
      {
        transportType: "bus",
        distance: 20
      },
      {
        transportType: "mrt",
        distance: 15
      }
    ]
  },
  
  // Mixed transport
  mixedTransport: {
    privateTransport: [
      {
        vehicleType: "car",
        vehicleSize: "medium",
        fuelType: "diesel",
        distance: 30
      },
      {
        vehicleType: "motorbike",
        vehicleSize: "small",
        fuelType: "petrol",
        distance: 25
      }
    ],
    publicTransport: [
      {
        transportType: "lrt",
        distance: 10
      },
      {
        transportType: "average train",
        distance: 40
      }
    ]
  },
  
  // Different vehicle types and sizes
  variousVehicles: {
    privateTransport: [
      {
        vehicleType: "car",
        vehicleSize: "small",
        fuelType: "petrol",
        distance: 20
      },
      {
        vehicleType: "car",
        vehicleSize: "medium",
        fuelType: "diesel",
        distance: 30
      },
      {
        vehicleType: "car",
        vehicleSize: "large",
        fuelType: "hybrid",
        distance: 40
      },
      {
        vehicleType: "car",
        vehicleSize: "average",
        fuelType: "phev",
        distance: 25
      },
      {
        vehicleType: "motorbike",
        vehicleSize: "small",
        fuelType: "petrol",
        distance: 15
      }
    ]
  },
  
  // Electric vehicles
  electricVehicles: {
    privateTransport: [
      {
        vehicleType: "car",
        vehicleSize: "medium",
        fuelType: "bev",
        distance: 50
      },
      {
        vehicleType: "car",
        vehicleSize: "large",
        fuelType: "electric",
        distance: 35
      }
    ]
  },
  
  // All public transport types
  allPublicTransport: {
    publicTransport: [
      {
        transportType: "bus",
        distance: 25
      },
      {
        transportType: "mrt",
        distance: 30
      },
      {
        transportType: "lrt",
        distance: 20
      },
      {
        transportType: "monorail",
        distance: 15
      },
      {
        transportType: "ktm",
        distance: 45
      },
      {
        transportType: "average train",
        distance: 60
      }
    ]
  },
  
  // Edge cases
  emptyTransport: {
    privateTransport: [],
    publicTransport: []
  },
  
  // Invalid data for error testing
  invalidData: {
    privateTransport: [
      {
        vehicleType: "invalid_type",
        vehicleSize: "small",
        fuelType: "petrol",
        distance: 50
      },
      {
        vehicleType: "car",
        vehicleSize: "invalid_size",
        fuelType: "petrol",
        distance: 50
      },
      {
        vehicleType: "car",
        vehicleSize: "small",
        fuelType: "invalid_fuel",
        distance: 50
      },
      {
        vehicleType: "car",
        vehicleSize: "small",
        fuelType: "petrol",
        distance: -10 // Negative distance
      },
      {
        vehicleType: "car",
        vehicleSize: "small",
        fuelType: "petrol"
        // Missing distance
      }
    ],
    publicTransport: [
      {
        transportType: "invalid_transport",
        distance: 20
      },
      {
        transportType: "bus",
        distance: -5 // Negative distance
      },
      {
        transportType: "mrt"
        // Missing distance
      }
    ]
  }
};

async function testTravelCalculator(testName, testData) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`📤 Request:`, JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${BASE_URL}/calculate/travel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`📊 Total Emissions: ${data.totalEmissions} kg CO2e`);
      console.log(`🌳 Tree Saplings Needed: ${data.treeSaplingsNeeded}`);
      
      if (data.results.privateTransport && data.results.privateTransport.breakdown.length > 0) {
        console.log(`🚗 Private Transport: ${data.results.privateTransport.total.toFixed(4)} kg CO2e (${data.results.privateTransport.breakdown.length} trips)`);
      }
      
      if (data.results.publicTransport && data.results.publicTransport.breakdown.length > 0) {
        console.log(`🚌 Public Transport: ${data.results.publicTransport.total.toFixed(4)} kg CO2e (${data.results.publicTransport.breakdown.length} trips)`);
      }
    } else {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`);
      if (data.details) {
        console.log(`📝 Details: ${JSON.stringify(data.details)}`);
      }
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testEmissionFactors() {
  try {
    console.log(`\n🧪 Testing Travel Emission Factors`);
    
    const response = await fetch(`${BASE_URL}/emission-factors/vehicles`);
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} Vehicle Emission Factors - Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`📊 Total Vehicle Factors: ${data.data.length}`);
      console.log(`📋 Sample Factors: ${data.data.slice(0, 3).map(factor => `${factor.categoryName} ${factor.sizeName} ${factor.fuelName}`).join(', ')}...`);
    } else {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testPublicTransportFactors() {
  try {
    console.log(`\n🧪 Testing Public Transport Emission Factors`);
    
    const response = await fetch(`${BASE_URL}/emission-factors/public-transport`);
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} Public Transport Factors - Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`📊 Total Public Transport Factors: ${data.data.length}`);
      console.log(`📋 Available Types: ${data.data.map(factor => factor.transportType).join(', ')}`);
    } else {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTravelCalculatorTests() {
  console.log('🚗 Testing GreenPulse Travel Calculator API\n');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let totalCount = 0;
  
  // Test calculator endpoints
  console.log('\n📊 CALCULATOR TESTS');
  console.log('-'.repeat(30));
  
  const calculatorTests = [
    { name: 'Private Transport Only', data: testData.privateTransportOnly },
    { name: 'Public Transport Only', data: testData.publicTransportOnly },
    { name: 'Mixed Transport', data: testData.mixedTransport },
    { name: 'Various Vehicle Types', data: testData.variousVehicles },
    { name: 'Electric Vehicles', data: testData.electricVehicles },
    { name: 'All Public Transport Types', data: testData.allPublicTransport },
    { name: 'Empty Transport Arrays', data: testData.emptyTransport },
    { name: 'Invalid Data (Error Testing)', data: testData.invalidData }
  ];
  
  for (const test of calculatorTests) {
    totalCount++;
    const result = await testTravelCalculator(test.name, test.data);
    if (result.success) successCount++;
  }
  
  // Test emission factor endpoints
  console.log('\n\n📋 EMISSION FACTOR TESTS');
  console.log('-'.repeat(30));
  
  totalCount++;
  const vehicleFactorsResult = await testEmissionFactors();
  if (vehicleFactorsResult.success) successCount++;
  
  totalCount++;
  const publicTransportFactorsResult = await testPublicTransportFactors();
  if (publicTransportFactorsResult.success) successCount++;
  
  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}`);
  console.log(`📈 Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All travel calculator tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  return { successCount, totalCount };
}

// Test specific scenarios
async function testSpecificScenarios() {
  console.log('\n\n🔍 SPECIFIC SCENARIO TESTS');
  console.log('=' .repeat(60));
  
  // Test daily commute scenario
  const dailyCommute = {
    privateTransport: [
      {
        vehicleType: "car",
        vehicleSize: "medium",
        fuelType: "petrol",
        distance: 20 // 10km each way
      }
    ]
  };
  
  await testTravelCalculator('Daily Commute (20km)', dailyCommute);
  
  // Test weekend trip scenario
  const weekendTrip = {
    privateTransport: [
      {
        vehicleType: "car",
        vehicleSize: "large",
        fuelType: "diesel",
        distance: 200 // 100km each way
      }
    ]
  };
  
  await testTravelCalculator('Weekend Trip (200km)', weekendTrip);
  
  // Test public transport daily commute
  const publicCommute = {
    publicTransport: [
      {
        transportType: "bus",
        distance: 5
      },
      {
        transportType: "mrt",
        distance: 15
      }
    ]
  };
  
  await testTravelCalculator('Public Transport Commute', publicCommute);
  
  // Test hybrid scenario
  const hybridScenario = {
    privateTransport: [
      {
        vehicleType: "car",
        vehicleSize: "small",
        fuelType: "hybrid",
        distance: 30
      }
    ],
    publicTransport: [
      {
        transportType: "lrt",
        distance: 10
      }
    ]
  };
  
  await testTravelCalculator('Hybrid Transport Scenario', hybridScenario);
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTravelCalculatorTests()
    .then(() => testSpecificScenarios())
    .catch(console.error);
}

export { testTravelCalculator, testEmissionFactors, runTravelCalculatorTests };
