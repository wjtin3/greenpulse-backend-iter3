import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

// Test all categories and detailed values
async function testAllCategories() {
  console.log('🧪 Testing All Categories and Detailed Values\n');

  // Test 1: Simple frequency for all categories
  console.log('📋 Test 1: Simple frequency for all categories');
  await testSimpleFrequencies();

  // Test 2: All detailed values for Animal category
  console.log('\n📋 Test 2: All detailed values for Animal category');
  await testAnimalDetailed();

  // Test 3: All detailed values for Plant category
  console.log('\n📋 Test 3: All detailed values for Plant category');
  await testPlantDetailed();

  // Test 4: All detailed values for Grain category
  console.log('\n📋 Test 4: All detailed values for Grain category');
  await testGrainDetailed();

  // Test 5: Mixed simple and detailed inputs
  console.log('\n📋 Test 5: Mixed simple and detailed inputs');
  await testMixedInputs();

  // Test 6: All frequencies for each category
  console.log('\n📋 Test 6: All frequencies for each category');
  await testAllFrequencies();
}

async function testSimpleFrequencies() {
  const testData = {
    foodItems: [
      { category: "animal", frequency: "Often" },
      { category: "plant", frequency: "Often" },
      { category: "grain", frequency: "Often" }
    ]
  };

  try {
    const response = await fetch(`${API_BASE_URL}/calculate/food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Total emissions: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      console.log(`   📊 Breakdown:`);
      result.results.breakdown.forEach(item => {
        console.log(`      ${item.category}: ${item.type} - ${item.emissions.toFixed(2)} kg CO2e`);
      });
    } else {
      console.log('   ❌ Failed:', await response.text());
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

async function testAnimalDetailed() {
  const animalTypes = ["Beef", "Lamb", "Pork", "Poultry", "Fish or shellfish", "Eggs, cheese or dairy"];
  
  for (const type of animalTypes) {
    const testData = {
      foodItems: [
        {
          category: "animal",
          frequency: "Often",
          detailed: [{ type, frequency: "Often" }]
        }
      ]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/calculate/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ ${type}: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`   ❌ ${type}: Failed - ${await response.text()}`);
      }
    } catch (error) {
      console.log(`   ❌ ${type}: Error - ${error.message}`);
    }
  }
}

async function testPlantDetailed() {
  const plantTypes = ["Fruits", "Vegetables"];
  
  for (const type of plantTypes) {
    const testData = {
      foodItems: [
        {
          category: "plant",
          frequency: "Often",
          detailed: [{ type, frequency: "Often" }]
        }
      ]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/calculate/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ ${type}: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`   ❌ ${type}: Failed - ${await response.text()}`);
      }
    } catch (error) {
      console.log(`   ❌ ${type}: Error - ${error.message}`);
    }
  }
}

async function testGrainDetailed() {
  const grainTypes = ["Rice", "Noodles", "Bread"];
  
  for (const type of grainTypes) {
    const testData = {
      foodItems: [
        {
          category: "grain",
          frequency: "Often",
          detailed: [{ type, frequency: "Often" }]
        }
      ]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/calculate/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ ${type}: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`   ❌ ${type}: Failed - ${await response.text()}`);
      }
    } catch (error) {
      console.log(`   ❌ ${type}: Error - ${error.message}`);
    }
  }
}

async function testMixedInputs() {
  const testData = {
    foodItems: [
      { category: "animal", frequency: "Often" }, // Simple
      { 
        category: "plant", 
        frequency: "Often", 
        detailed: [{ type: "Fruits", frequency: "Very Often" }] // Detailed
      },
      { 
        category: "grain", 
        frequency: "Often", 
        detailed: [
          { type: "Rice", frequency: "Often" },
          { type: "Bread", frequency: "Occasionally" }
        ] // Multiple detailed items
      }
    ]
  };

  try {
    const response = await fetch(`${API_BASE_URL}/calculate/food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Mixed inputs: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      console.log(`   📊 Breakdown:`);
      result.results.breakdown.forEach(item => {
        console.log(`      ${item.category}: ${item.type} - ${item.emissions.toFixed(2)} kg CO2e`);
      });
    } else {
      console.log('   ❌ Failed:', await response.text());
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

async function testAllFrequencies() {
  const frequencies = ["Never", "Infrequently", "Occasionally", "Often", "Very Often"];
  
  console.log('   Testing Animal category with all frequencies:');
  for (const frequency of frequencies) {
    const testData = {
      foodItems: [{ category: "animal", frequency }]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/calculate/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`      ${frequency}: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`      ${frequency}: Failed`);
      }
    } catch (error) {
      console.log(`      ${frequency}: Error`);
    }
  }

  console.log('   Testing Plant category with all frequencies:');
  for (const frequency of frequencies) {
    const testData = {
      foodItems: [{ category: "plant", frequency }]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/calculate/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`      ${frequency}: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`      ${frequency}: Failed`);
      }
    } catch (error) {
      console.log(`      ${frequency}: Error`);
    }
  }

  console.log('   Testing Grain category with all frequencies:');
  for (const frequency of frequencies) {
    const testData = {
      foodItems: [{ category: "grain", frequency }]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/calculate/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`      ${frequency}: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`      ${frequency}: Failed`);
      }
    } catch (error) {
      console.log(`      ${frequency}: Error`);
    }
  }
}

// Run all tests
testAllCategories();
