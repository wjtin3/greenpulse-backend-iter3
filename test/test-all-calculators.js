#!/usr/bin/env node

/**
 * Test all four calculators: Food, Shopping, Travel, and Household
 */

const BASE_URL = 'http://localhost:3001/api';

async function testAllCalculators() {
  console.log('🧪 TESTING ALL GREENPULSE CALCULATORS');
  console.log('=' .repeat(60));
  
  const tests = [
    {
      name: '🍎 FOOD CALCULATOR',
      url: '/calculate/food',
      data: {
        foodItems: [
          {foodType: 'Apples', quantity: 2},
          {foodType: 'Chicken breast', quantity: 1.5}
        ]
      }
    },
    {
      name: '🛒 SHOPPING CALCULATOR',
      url: '/calculate/shopping',
      data: {
        shoppingItems: [
          {type: 'Supermarkets and Other Grocery (except Convenience) Stores', quantity: 100},
          {type: 'Clothing Stores', quantity: 200}
        ]
      }
    },
    {
      name: '🚗 TRAVEL CALCULATOR',
      url: '/calculate/travel',
      data: {
        privateTransport: [
          {vehicleType: 'car', vehicleSize: 'small', fuelType: 'petrol', distance: 50}
        ],
        publicTransport: [
          {transportType: 'bus', distance: 20}
        ]
      }
    },
    {
      name: '🏠 HOUSEHOLD CALCULATOR',
      url: '/calculate/household',
      data: {
        numberOfPeople: 2,
        electricityUsage: 200,
        waterUsage: 10,
        wasteDisposal: 5
      }
    }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('-'.repeat(30));
    
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(test.data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Status: Success');
        if (result.totalEmissions) {
          console.log(`📊 Total Emissions: ${result.totalEmissions} kg CO2e`);
          console.log(`🌳 Tree Saplings: ${result.treeSaplingsNeeded}`);
        } else if (result.totalMonthlyEmissions) {
          console.log(`📊 Monthly Emissions: ${result.totalMonthlyEmissions} kg CO2e`);
          console.log(`🌳 Tree Saplings: ${result.treeSaplingsNeeded}`);
        }
        successCount++;
      } else {
        console.log('❌ Status: Failed');
        console.log(`Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 RESULTS: ${successCount}/${tests.length} calculators working`);
  
  if (successCount === tests.length) {
    console.log('🎉 ALL CALCULATORS ARE WORKING PERFECTLY!');
  } else {
    console.log('⚠️  Some calculators have issues. Check the errors above.');
  }
}

// Run tests
testAllCalculators().catch(console.error);
