#!/usr/bin/env node

/**
 * Comprehensive test script for Shopping Calculator API
 * Tests all shopping calculator endpoints and scenarios
 */

const BASE_URL = 'http://localhost:3001/api';

// Test data for shopping calculator
const testData = {
  // Single shopping item
  singleItem: {
    shoppingItems: [
      {
        type: "Supermarkets and Other Grocery (except Convenience) Stores",
        quantity: 100
      }
    ]
  },
  
  // Multiple items from different groups
  multipleItems: {
    shoppingItems: [
      {
        type: "Supermarkets and Other Grocery (except Convenience) Stores",
        quantity: 100
      },
      {
        type: "Clothing Stores",
        quantity: 200
      },
      {
        type: "Furniture Stores",
        quantity: 500
      },
      {
        type: "Pharmacies and Drug Stores",
        quantity: 50
      }
    ]
  },
  
  // Average subcategory calculation
  averageCalculation: {
    shoppingItems: [
      {
        type: "average",
        subcategoryGroup: "Groceries & Beverages",
        quantity: 100
      }
    ]
  },
  
  // Mixed specific and average items
  mixedCalculation: {
    shoppingItems: [
      {
        type: "Supermarkets and Other Grocery (except Convenience) Stores",
        quantity: 100
      },
      {
        type: "average",
        subcategoryGroup: "Clothing",
        quantity: 200
      },
      {
        type: "Book Stores",
        quantity: 50
      }
    ]
  },
  
  // Case insensitive tests
  caseInsensitive: {
    shoppingItems: [
      {
        type: "supermarkets and other grocery (except convenience) stores",
        quantity: 100
      },
      {
        type: "CLOTHING STORES",
        quantity: 200
      },
      {
        type: "average",
        subcategoryGroup: "groceries & beverages",
        quantity: 50
      }
    ]
  },
  
  // Edge cases
  emptyItems: {
    shoppingItems: []
  },
  
  // Invalid data for error testing
  invalidData: {
    shoppingItems: [
      {
        // Missing type
        quantity: 100
      },
      {
        type: "Supermarkets and Other Grocery (except Convenience) Stores",
        // Missing quantity
      },
      {
        type: "average",
        // Missing subcategoryGroup
        quantity: 100
      },
      {
        type: "Supermarkets and Other Grocery (except Convenience) Stores",
        quantity: -50 // Negative quantity
      },
      {
        type: 123, // Invalid type (not string)
        quantity: 100
      }
    ]
  }
};

// Dropdown endpoints to test
const dropdownEndpoints = [
  '/shopping-dropdown/groceries-beverages',
  '/shopping-dropdown/home-garden-appliances-entertainment-general',
  '/shopping-dropdown/clothing-accessories-health-pharmacy'
];

async function testShoppingCalculator(testName, testData) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`📤 Request:`, JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${BASE_URL}/calculate/shopping`, {
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

async function runShoppingCalculatorTests() {
  console.log('🛒 Testing GreenPulse Shopping Calculator API\n');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let totalCount = 0;
  
  // Test calculator endpoints
  console.log('\n📊 CALCULATOR TESTS');
  console.log('-'.repeat(30));
  
  const calculatorTests = [
    { name: 'Single Shopping Item', data: testData.singleItem },
    { name: 'Multiple Items (Different Groups)', data: testData.multipleItems },
    { name: 'Average Subcategory Calculation', data: testData.averageCalculation },
    { name: 'Mixed Specific and Average', data: testData.mixedCalculation },
    { name: 'Case Insensitive Matching', data: testData.caseInsensitive },
    { name: 'Empty Items Array', data: testData.emptyItems },
    { name: 'Invalid Data (Error Testing)', data: testData.invalidData }
  ];
  
  for (const test of calculatorTests) {
    totalCount++;
    const result = await testShoppingCalculator(test.name, test.data);
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
    console.log('\n🎉 All shopping calculator tests passed!');
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
    'General Merchandise',
    'Groceries & Beverages',
    'Clothing',
    'Accessories',
    'Health & Pharmacy',
    'Home & Garden',
    'Home, Appliances & Electronics',
    'Entertainment'
  ];
  
  for (const group of subcategoryGroups) {
    const testData = {
      shoppingItems: [
        {
          type: "average",
          subcategoryGroup: group,
          quantity: 100
        }
      ]
    };
    
    await testShoppingCalculator(`Average ${group}`, testData);
  }
  
  // Test specific high-value shopping scenarios
  const highValueScenarios = [
    { type: "Furniture Stores", quantity: 1000 },
    { type: "Household Appliance Stores", quantity: 800 },
    { type: "Electronics Stores", quantity: 600 }
  ];
  
  for (const scenario of highValueScenarios) {
    const testData = { shoppingItems: [scenario] };
    await testShoppingCalculator(`High Value: ${scenario.type}`, testData);
  }
  
  // Test specific low-value shopping scenarios
  const lowValueScenarios = [
    { type: "Convenience Stores", quantity: 50 },
    { type: "Pharmacies and Drug Stores", quantity: 30 },
    { type: "Book Stores", quantity: 25 }
  ];
  
  for (const scenario of lowValueScenarios) {
    const testData = { shoppingItems: [scenario] };
    await testShoppingCalculator(`Low Value: ${scenario.type}`, testData);
  }
  
  // Test mixed shopping basket
  const mixedBasket = {
    shoppingItems: [
      { type: "Supermarkets and Other Grocery (except Convenience) Stores", quantity: 200 },
      { type: "Clothing Stores", quantity: 150 },
      { type: "Furniture Stores", quantity: 300 },
      { type: "Pharmacies and Drug Stores", quantity: 75 },
      { type: "Book Stores", quantity: 50 },
      { type: "average", subcategoryGroup: "Entertainment", quantity: 100 }
    ]
  };
  
  await testShoppingCalculator('Mixed Shopping Basket', mixedBasket);
}

// Test emission factors endpoint
async function testEmissionFactors() {
  console.log('\n\n📊 EMISSION FACTORS TEST');
  console.log('=' .repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/emission-factors/shopping`);
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} Shopping Emission Factors - Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`📊 Total Emission Factors: ${data.data.length}`);
      console.log(`📋 Sample Factors: ${data.data.slice(0, 3).map(factor => factor.name).join(', ')}...`);
    } else {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runShoppingCalculatorTests()
    .then(() => testSpecificScenarios())
    .then(() => testEmissionFactors())
    .catch(console.error);
}

export { testShoppingCalculator, testDropdownEndpoint, runShoppingCalculatorTests };
