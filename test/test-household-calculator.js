#!/usr/bin/env node

/**
 * Comprehensive test script for Household Calculator API
 * Tests all household calculator endpoints and scenarios
 */

const BASE_URL = 'http://localhost:3001/api';

// Test data for household calculator
const testData = {
  // Basic household
  basicHousehold: {
    numberOfPeople: 2,
    electricityUsage: 200,
    waterUsage: 10,
    wasteDisposal: 5
  },
  
  // Large household
  largeHousehold: {
    numberOfPeople: 5,
    electricityUsage: 500,
    waterUsage: 25,
    wasteDisposal: 12
  },
  
  // Single person household
  singlePerson: {
    numberOfPeople: 1,
    electricityUsage: 100,
    waterUsage: 5,
    wasteDisposal: 3
  },
  
  // High consumption household
  highConsumption: {
    numberOfPeople: 4,
    electricityUsage: 800,
    waterUsage: 40,
    wasteDisposal: 20
  },
  
  // Low consumption household
  lowConsumption: {
    numberOfPeople: 2,
    electricityUsage: 150,
    waterUsage: 8,
    wasteDisposal: 4
  },
  
  // Zero usage scenarios
  zeroUsage: {
    numberOfPeople: 2,
    electricityUsage: 0,
    waterUsage: 0,
    wasteDisposal: 0
  },
  
  // Minimal household (just people)
  minimalHousehold: {
    numberOfPeople: 1,
    electricityUsage: 0,
    waterUsage: 0,
    wasteDisposal: 0
  },
  
  // Invalid data for error testing
  invalidData: {
    numberOfPeople: 0, // Invalid: must be positive
    electricityUsage: -50, // Invalid: negative
    waterUsage: -10, // Invalid: negative
    wasteDisposal: -5 // Invalid: negative
  },
  
  // Missing required fields
  missingFields: {
    // Missing numberOfPeople
    electricityUsage: 200,
    waterUsage: 10,
    wasteDisposal: 5
  },
  
  // Edge case: very large household
  veryLargeHousehold: {
    numberOfPeople: 10,
    electricityUsage: 1000,
    waterUsage: 50,
    wasteDisposal: 25
  }
};

async function testHouseholdCalculator(testName, testData) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`📤 Request:`, JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${BASE_URL}/calculate/household`, {
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
      console.log(`📊 Total Monthly Emissions: ${data.totalMonthlyEmissions} kg CO2e`);
      console.log(`🌳 Tree Saplings Needed: ${data.treeSaplingsNeeded}`);
      console.log(`📋 Breakdown Items: ${data.results.breakdown.length}`);
      
      // Show breakdown details
      data.results.breakdown.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.category}: ${item.monthlyEmissions.toFixed(4)} kg CO2e`);
        if (item.numberOfPeople) {
          console.log(`      People: ${item.numberOfPeople}`);
        }
        if (item.monthlyUsage !== undefined) {
          console.log(`      Usage: ${item.monthlyUsage} ${item.factor}`);
        }
        if (item.weeklyUsage !== undefined) {
          console.log(`      Weekly Usage: ${item.weeklyUsage} ${item.factor}`);
        }
      });
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

async function testHouseholdEmissionFactors() {
  try {
    console.log(`\n🧪 Testing Household Emission Factors`);
    
    const response = await fetch(`${BASE_URL}/emission-factors/household`);
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} Household Emission Factors - Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`📊 Total Household Factors: ${data.data.length}`);
      console.log(`📋 Available Categories: ${[...new Set(data.data.map(factor => factor.categoryName))].join(', ')}`);
      console.log(`📋 Sample Factors: ${data.data.slice(0, 3).map(factor => factor.factorName).join(', ')}...`);
    } else {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runHouseholdCalculatorTests() {
  console.log('🏠 Testing GreenPulse Household Calculator API\n');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let totalCount = 0;
  
  // Test calculator endpoints
  console.log('\n📊 CALCULATOR TESTS');
  console.log('-'.repeat(30));
  
  const calculatorTests = [
    { name: 'Basic Household (2 people)', data: testData.basicHousehold },
    { name: 'Large Household (5 people)', data: testData.largeHousehold },
    { name: 'Single Person Household', data: testData.singlePerson },
    { name: 'High Consumption Household', data: testData.highConsumption },
    { name: 'Low Consumption Household', data: testData.lowConsumption },
    { name: 'Zero Usage Scenario', data: testData.zeroUsage },
    { name: 'Minimal Household (People Only)', data: testData.minimalHousehold },
    { name: 'Very Large Household (10 people)', data: testData.veryLargeHousehold },
    { name: 'Invalid Data (Error Testing)', data: testData.invalidData },
    { name: 'Missing Required Fields (Error Testing)', data: testData.missingFields }
  ];
  
  for (const test of calculatorTests) {
    totalCount++;
    const result = await testHouseholdCalculator(test.name, test.data);
    if (result.success) successCount++;
  }
  
  // Test emission factor endpoint
  console.log('\n\n📋 EMISSION FACTOR TESTS');
  console.log('-'.repeat(30));
  
  totalCount++;
  const emissionFactorsResult = await testHouseholdEmissionFactors();
  if (emissionFactorsResult.success) successCount++;
  
  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}`);
  console.log(`📈 Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All household calculator tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  return { successCount, totalCount };
}

// Test specific scenarios
async function testSpecificScenarios() {
  console.log('\n\n🔍 SPECIFIC SCENARIO TESTS');
  console.log('=' .repeat(60));
  
  // Test typical Malaysian household scenarios
  const scenarios = [
    {
      name: 'Typical Urban Family',
      data: {
        numberOfPeople: 4,
        electricityUsage: 300, // kWh/month
        waterUsage: 15, // m³/month
        wasteDisposal: 8 // kg/week
      }
    },
    {
      name: 'Eco-Conscious Family',
      data: {
        numberOfPeople: 3,
        electricityUsage: 150, // Lower electricity usage
        waterUsage: 8, // Lower water usage
        wasteDisposal: 4 // Lower waste
      }
    },
    {
      name: 'High-Energy Household',
      data: {
        numberOfPeople: 6,
        electricityUsage: 600, // High electricity usage
        waterUsage: 30, // High water usage
        wasteDisposal: 15 // High waste
      }
    },
    {
      name: 'Student/Young Professional',
      data: {
        numberOfPeople: 1,
        electricityUsage: 80, // Minimal usage
        waterUsage: 4, // Minimal usage
        wasteDisposal: 2 // Minimal waste
      }
    },
    {
      name: 'Senior Citizen Household',
      data: {
        numberOfPeople: 2,
        electricityUsage: 120, // Moderate usage
        waterUsage: 6, // Moderate usage
        wasteDisposal: 3 // Moderate waste
      }
    }
  ];
  
  for (const scenario of scenarios) {
    await testHouseholdCalculator(scenario.name, scenario.data);
  }
  
  // Test per-person emission calculations
  console.log('\n📊 PER-PERSON EMISSION ANALYSIS');
  console.log('-'.repeat(40));
  
  const perPersonTests = [
    { people: 1, electricity: 100, water: 5, waste: 3 },
    { people: 2, electricity: 200, water: 10, waste: 6 },
    { people: 4, electricity: 400, water: 20, waste: 12 }
  ];
  
  for (const test of perPersonTests) {
    const testData = {
      numberOfPeople: test.people,
      electricityUsage: test.electricity,
      waterUsage: test.water,
      wasteDisposal: test.waste
    };
    
    const response = await fetch(`${BASE_URL}/calculate/household`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      const perPersonEmissions = data.totalMonthlyEmissions / test.people;
      console.log(`${test.people} people: ${data.totalMonthlyEmissions.toFixed(2)} kg CO2e total, ${perPersonEmissions.toFixed(2)} kg CO2e per person`);
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHouseholdCalculatorTests()
    .then(() => testSpecificScenarios())
    .catch(console.error);
}

export { testHouseholdCalculator, testHouseholdEmissionFactors, runHouseholdCalculatorTests };
