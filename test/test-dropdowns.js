#!/usr/bin/env node

/**
 * Test all dropdown endpoints
 */

const BASE_URL = 'http://localhost:3001/api';

async function testDropdowns() {
  console.log('🧪 TESTING DROPDOWN ENDPOINTS');
  console.log('=' .repeat(40));
  
  const dropdownTests = [
    { name: 'Food - Fruits & Vegetables', url: '/food-dropdown/fruits-vegetables' },
    { name: 'Food - Poultry & Meats', url: '/food-dropdown/poultry-redmeats-seafood' },
    { name: 'Food - Staples & Grain', url: '/food-dropdown/staples-grain' },
    { name: 'Food - Processed & Dairy', url: '/food-dropdown/processed-dairy' },
    { name: 'Shopping - Groceries', url: '/shopping-dropdown/groceries-beverages' },
    { name: 'Shopping - Home & Garden', url: '/shopping-dropdown/home-garden-appliances-entertainment-general' },
    { name: 'Shopping - Clothing', url: '/shopping-dropdown/clothing-accessories-health-pharmacy' }
  ];
  
  let successCount = 0;
  
  for (const test of dropdownTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${test.name}: ${data.count} items`);
        successCount++;
      } else {
        console.log(`❌ ${test.name}: Failed`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 RESULTS: ${successCount}/${dropdownTests.length} dropdowns working`);
  
  if (successCount === dropdownTests.length) {
    console.log('🎉 ALL DROPDOWN ENDPOINTS WORKING!');
  }
}

testDropdowns().catch(console.error);
