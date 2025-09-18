import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

// Test specific detailed frequency combinations
async function testDetailedFrequencies() {
  console.log('🧪 Testing Detailed Frequency Combinations\n');

  // Test 1: All frequencies for Beef (should follow 0,0,3,5,7 pattern)
  console.log('📋 Test 1: Beef with all frequencies (0,0,3,5,7 pattern)');
  await testBeefFrequencies();

  // Test 2: All frequencies for Eggs (should follow 0,4,5,6,7 pattern)
  console.log('\n📋 Test 2: Eggs with all frequencies (0,4,5,6,7 pattern)');
  await testEggsFrequencies();

  // Test 3: All frequencies for Rice (should follow 0,4,5,6,7 pattern)
  console.log('\n📋 Test 3: Rice with all frequencies (0,4,5,6,7 pattern)');
  await testRiceFrequencies();

  // Test 4: Multiple detailed items in one category
  console.log('\n📋 Test 4: Multiple detailed items in Animal category');
  await testMultipleAnimalItems();

  // Test 5: All detailed items for each category with "Often" frequency
  console.log('\n📋 Test 5: All detailed items with "Often" frequency');
  await testAllDetailedOften();
}

async function testBeefFrequencies() {
  const frequencies = ["Never", "Infrequently", "Occasionally", "Often", "Very Often"];
  const expectedMultipliers = [0, 0, 3, 5, 7];
  
  for (let i = 0; i < frequencies.length; i++) {
    const frequency = frequencies[i];
    const expectedMultiplier = expectedMultipliers[i];
    
    const testData = {
      foodItems: [
        {
          category: "animal",
          frequency: "Often",
          detailed: [{ type: "Beef", frequency }]
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
        const emissions = result.totalEmissions;
        console.log(`   ${frequency} (expected multiplier: ${expectedMultiplier}): ${emissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`   ${frequency}: Failed`);
      }
    } catch (error) {
      console.log(`   ${frequency}: Error`);
    }
  }
}

async function testEggsFrequencies() {
  const frequencies = ["Never", "Infrequently", "Occasionally", "Often", "Very Often"];
  const expectedMultipliers = [0, 4, 5, 6, 7];
  
  for (let i = 0; i < frequencies.length; i++) {
    const frequency = frequencies[i];
    const expectedMultiplier = expectedMultipliers[i];
    
    const testData = {
      foodItems: [
        {
          category: "animal",
          frequency: "Often",
          detailed: [{ type: "Eggs, cheese or dairy", frequency }]
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
        const emissions = result.totalEmissions;
        console.log(`   ${frequency} (expected multiplier: ${expectedMultiplier}): ${emissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`   ${frequency}: Failed`);
      }
    } catch (error) {
      console.log(`   ${frequency}: Error`);
    }
  }
}

async function testRiceFrequencies() {
  const frequencies = ["Never", "Infrequently", "Occasionally", "Often", "Very Often"];
  const expectedMultipliers = [0, 4, 5, 6, 7];
  
  for (let i = 0; i < frequencies.length; i++) {
    const frequency = frequencies[i];
    const expectedMultiplier = expectedMultipliers[i];
    
    const testData = {
      foodItems: [
        {
          category: "grain",
          frequency: "Often",
          detailed: [{ type: "Rice", frequency }]
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
        const emissions = result.totalEmissions;
        console.log(`   ${frequency} (expected multiplier: ${expectedMultiplier}): ${emissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`   ${frequency}: Failed`);
      }
    } catch (error) {
      console.log(`   ${frequency}: Error`);
    }
  }
}

async function testMultipleAnimalItems() {
  const testData = {
    foodItems: [
      {
        category: "animal",
        frequency: "Often",
        detailed: [
          { type: "Beef", frequency: "Occasionally" },
          { type: "Poultry", frequency: "Often" },
          { type: "Fish or shellfish", frequency: "Infrequently" },
          { type: "Eggs, cheese or dairy", frequency: "Very Often" }
        ]
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
      console.log(`   ✅ Total emissions: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      console.log(`   📊 Breakdown:`);
      result.results.breakdown.forEach(item => {
        console.log(`      ${item.type}: ${item.frequency} - ${item.emissions.toFixed(2)} kg CO2e`);
      });
    } else {
      console.log('   ❌ Failed:', await response.text());
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

async function testAllDetailedOften() {
  console.log('   Animal products:');
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
        console.log(`      ${type}: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`      ${type}: Failed`);
      }
    } catch (error) {
      console.log(`      ${type}: Error`);
    }
  }

  console.log('   Plant products:');
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
        console.log(`      ${type}: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`      ${type}: Failed`);
      }
    } catch (error) {
      console.log(`      ${type}: Error`);
    }
  }

  console.log('   Grain products:');
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
        console.log(`      ${type}: ${result.totalEmissions.toFixed(2)} kg CO2e`);
      } else {
        console.log(`      ${type}: Failed`);
      }
    } catch (error) {
      console.log(`      ${type}: Error`);
    }
  }
}

// Run all tests
testDetailedFrequencies();
