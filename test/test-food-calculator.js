#!/usr/bin/env node

/**
 * Comprehensive test script for Food Calculator API
 * Tests all food calculator endpoints and scenarios
 */

const BASE_URL = 'http://localhost:3001/api';

// Test data for food calculator
const testData = {
  // Single food item tests
  singleItem: {
    foodItems: [
      {
        foodType: "Apples",
        quantity: 2
      }
    ]
  },
  
  // Multiple items from different groups
  multipleItems: {
    foodItems: [
      {
        foodType: "Apples",
        quantity: 2
      },
      {
        foodType: "Chicken breast",
        quantity: 1.5
      },
      {
        foodType: "Rice",
        quantity: 1
      },
      {
        foodType: "Milk",
        quantity: 2
      }
    ]
  },
  
  // Average subcategory calculation
  averageCalculation: {
    foodItems: [
      {
        foodType: "average",
        subcategoryGroup: "Fruits",
        quantity: 1
      }
    ]
  },
  
  // Mixed specific and average items
  mixedCalculation: {
    foodItems: [
      {
        foodType: "Beef steak",
        quantity: 0.5
      },
      {
        foodType: "average",
        subcategoryGroup: "Dairy",
        quantity: 1
      },
      {
        foodType: "Bread",
        quantity: 2
      }
    ]
  },
  
  // Case insensitive tests
  caseInsensitive: {
    foodItems: [
      {
        foodType: "apples",
        quantity: 2
      },
      {
        foodType: "CHICKEN BREAST",
        quantity: 1.5
      },
      {
        foodType: "average",
        subcategoryGroup: "fruits",
        quantity: 1
      }
    ]
  },
  
  // Edge cases
  emptyItems: {
    foodItems: []
  },
  
  // Invalid data for error testing
  invalidData: {
    foodItems: [
      {
        // Missing foodType
        quantity: 2
      },
      {
        foodType: "Apples",
        // Missing quantity
      },
      {
        foodType: "average",
        // Missing subcategoryGroup
        quantity: 1
      },
      {
        foodType: "Apples",
        quantity: -1 // Negative quantity
      }
    ]
  }
};

// Dropdown endpoints to test
const dropdownEndpoints = [
  '/food-dropdown/fruits-vegetables',
  '/food-dropdown/poultry-redmeats-seafood',
  '/food-dropdown/staples-grain',
  '/food-dropdown/processed-dairy'
];

async function testFoodCalculator(testName, testData) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`📤 Request:`, JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${BASE_URL}/calculate/food`, {
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
      console.log(`📋 Breakdown Items: ${data.results.breakdown.length}`);
      console.log(`🏷️  Groups: ${Object.keys(data.results.groups).length}`);
      
      // Show group totals
      Object.entries(data.results.groups).forEach(([key, group]) => {
        if (group.total > 0) {
          console.log(`   ${group.name}: ${group.total.toFixed(4)} kg CO2e`);
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

async function testDropdownEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing Dropdown: ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`📊 Items Count: ${data.count}`);
      console.log(`🏷️  Subcategories: ${data.subcategories.join(', ')}`);
      console.log(`📋 Sample Items: ${data.data.slice(0, 3).map(item => item.name).join(', ')}...`);
    } else {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runFoodCalculatorTests() {
  console.log('🍎 Testing GreenPulse Food Calculator API\n');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let totalCount = 0;
  
  // Test calculator endpoints
  console.log('\n📊 CALCULATOR TESTS');
  console.log('-'.repeat(30));
  
  const calculatorTests = [
    { name: 'Single Food Item', data: testData.singleItem },
    { name: 'Multiple Items (Different Groups)', data: testData.multipleItems },
    { name: 'Average Subcategory Calculation', data: testData.averageCalculation },
    { name: 'Mixed Specific and Average', data: testData.mixedCalculation },
    { name: 'Case Insensitive Matching', data: testData.caseInsensitive },
    { name: 'Empty Items Array', data: testData.emptyItems },
    { name: 'Invalid Data (Error Testing)', data: testData.invalidData }
  ];
  
  for (const test of calculatorTests) {
    totalCount++;
    const result = await testFoodCalculator(test.name, test.data);
    if (result.success) successCount++;
  }
  
  // Test dropdown endpoints
  console.log('\n\n📋 DROPDOWN TESTS');
  console.log('-'.repeat(30));
  
  for (const endpoint of dropdownEndpoints) {
    totalCount++;
    const result = await testDropdownEndpoint(endpoint);
    if (result.success) successCount++;
  }
  
  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}`);
  console.log(`📈 Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All food calculator tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  return { successCount, totalCount };
}

// Test specific scenarios
async function testSpecificScenarios() {
  console.log('\n\n🔍 SPECIFIC SCENARIO TESTS');
  console.log('=' .repeat(60));
  
  // Test all subcategory groups with averages
  const subcategoryGroups = [
    'Processed Foods and Other',
    'Fruits',
    'Vegetables', 
    'Red Meats',
    'Grains',
    'Dairy',
    'Poultry',
    'Seafood',
    'Staples'
  ];
  
  for (const group of subcategoryGroups) {
    const testData = {
      foodItems: [
        {
          foodType: "average",
          subcategoryGroup: group,
          quantity: 1
        }
      ]
    };
    
    await testFoodCalculator(`Average ${group}`, testData);
  }
  
  // Test specific high-emission foods
  const highEmissionFoods = [
    { foodType: "Beef steak", quantity: 1 },
    { foodType: "Lamb chops", quantity: 1 },
    { foodType: "Bacon", quantity: 1 }
  ];
  
  for (const food of highEmissionFoods) {
    const testData = { foodItems: [food] };
    await testFoodCalculator(`High Emission: ${food.foodType}`, testData);
  }
  
  // Test specific low-emission foods
  const lowEmissionFoods = [
    { foodType: "Apples", quantity: 1 },
    { foodType: "Carrots", quantity: 1 },
    { foodType: "Rice", quantity: 1 }
  ];
  
  for (const food of lowEmissionFoods) {
    const testData = { foodItems: [food] };
    await testFoodCalculator(`Low Emission: ${food.foodType}`, testData);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFoodCalculatorTests()
    .then(() => testSpecificScenarios())
    .catch(console.error);
}

export { testFoodCalculator, testDropdownEndpoint, runFoodCalculatorTests };
