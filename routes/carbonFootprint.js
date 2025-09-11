import express from 'express';
import { db } from '../config/database.js';
import { foodEntities, foodSubcategories, foodCategories, foodEmissionFactors, shoppingEntities, shoppingSubcategories, shoppingCategories, shoppingEmissionFactors, vehicleEmissionFactor, vehicleCategory, vehicleSize, fuelType, publicTransport, householdFactors, householdFactorCategory, region } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

const router = express.Router();

// Test database connection endpoint
router.get('/test-db', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ 
        error: 'Database instance not available',
        message: 'Database connection failed to initialize'
      });
    }

    // Try a simple query
    const result = await db.select().from(vehicleCategory).limit(1);
    
    res.json({
      success: true,
      message: 'Database connection successful',
      testResult: result.length > 0 ? 'Data found' : 'No data found',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      error: 'Database test failed',
      message: error.message,
      environment: process.env.NODE_ENV
    });
  }
});

// Test schema imports endpoint
router.get('/test-schema', async (req, res) => {
  try {
    console.log('Testing schema imports...');
    
    const schemaTests = {
      vehicleEmissionFactor: !!vehicleEmissionFactor,
      vehicleCategory: !!vehicleCategory,
      vehicleSize: !!vehicleSize,
      fuelType: !!fuelType,
      publicTransport: !!publicTransport,
      db: !!db
    };
    
    console.log('Schema test results:', schemaTests);
    
    res.json({
      success: true,
      message: 'Schema import test completed',
      results: schemaTests
    });
  } catch (error) {
    console.error('Schema test error:', error);
    res.status(500).json({
      error: 'Schema test failed',
      message: error.message
    });
  }
});

// Test travel calculator tables endpoint
router.get('/test-travel-tables', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ 
                error: 'Database instance not available',
                message: 'Database connection failed to initialize'
            });
        }

        // Test all tables used in travel calculator
        const vehicleCategories = await db.select().from(vehicleCategory).limit(1);
        const vehicleSizes = await db.select().from(vehicleSize).limit(1);
        const fuelTypes = await db.select().from(fuelType).limit(1);
        const vehicleFactors = await db.select().from(vehicleEmissionFactor).limit(1);
        const publicTransportData = await db.select().from(publicTransport).limit(1);
        
        res.json({
            success: true,
            message: 'Travel calculator tables test',
            results: {
                vehicleCategories: vehicleCategories.length,
                vehicleSizes: vehicleSizes.length,
                fuelTypes: fuelTypes.length,
                vehicleFactors: vehicleFactors.length,
                publicTransport: publicTransportData.length
            },
            environment: process.env.NODE_ENV
        });
    } catch (error) {
        console.error('Travel tables test failed:', error);
        res.status(500).json({
            error: 'Travel tables test failed',
            message: error.message,
            environment: process.env.NODE_ENV
        });
    }
});

// Comprehensive system test endpoint
router.get('/test-all-systems', async (req, res) => {
    try {
        console.log('Starting comprehensive system test...');
        
        if (!db) {
            return res.status(500).json({ 
                error: 'Database instance not available',
                message: 'Database connection failed to initialize'
            });
        }

        const testResults = {
            database: { status: 'unknown', details: {} },
            tables: { status: 'unknown', details: {} },
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        };

        // Test database connection
        try {
            const dbTest = await db.select().from(vehicleCategory).limit(1);
            testResults.database = { 
                status: 'connected', 
                details: { testQuery: 'successful' }
            };
        } catch (dbError) {
            testResults.database = { 
                status: 'error', 
                details: { error: dbError.message }
            };
        }

        // Test all calculator tables
        const tableTests = [
            { name: 'vehicleCategory', table: vehicleCategory },
            { name: 'vehicleSize', table: vehicleSize },
            { name: 'fuelType', table: fuelType },
            { name: 'vehicleEmissionFactor', table: vehicleEmissionFactor },
            { name: 'publicTransport', table: publicTransport },
            { name: 'householdFactors', table: householdFactors },
            { name: 'foodEmissionFactors', table: foodEmissionFactors },
            { name: 'shoppingEmissionFactors', table: shoppingEmissionFactors }
        ];

        for (const test of tableTests) {
            try {
                const result = await db.select().from(test.table).limit(1);
                testResults.tables[test.name] = { 
                    status: 'accessible', 
                    recordCount: result.length 
                };
            } catch (error) {
                testResults.tables[test.name] = { 
                    status: 'error', 
                    error: error.message 
                };
            }
        }

        const allTablesWorking = Object.values(testResults.tables).every(t => t.status === 'accessible');
        testResults.tables.status = allTablesWorking ? 'all_working' : 'some_errors';

        console.log('Comprehensive system test completed');
        res.json({
            success: true,
            message: 'Comprehensive system test completed',
            results: testResults
        });

    } catch (error) {
        console.error('Comprehensive system test failed:', error);
        res.status(500).json({
            error: 'Comprehensive system test failed',
            message: error.message,
            environment: process.env.NODE_ENV
        });
    }
});

// Calculate travel carbon footprint
router.post('/calculate/travel', async (req, res) => {
  try {
    const { privateTransport = [], publicTransport = [] } = req.body;

    // If both arrays are empty, return zero emissions
    if ((!privateTransport || privateTransport.length === 0) && 
        (!publicTransport || publicTransport.length === 0)) {
      return res.json({
        success: true,
        totalEmissions: 0,
        treeSaplingsNeeded: "0.00",
        results: {
          privateTransport: { total: 0, breakdown: [] },
          publicTransport: { total: 0, breakdown: [] }
        }
      });
    }

    // Check if database is available
    if (!db) {
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'Database instance is not initialized'
      });
    }

    // Get emission factors and lookup tables from database
    let vehicleFactors, categoryFactors, sizeFactors, fuelFactors, publicTransportFactors;
    
    try {
      // Debug: Check schema tables before using them
      console.log('Travel calculator - Schema table checks:');
      console.log('vehicleEmissionFactor:', !!vehicleEmissionFactor, typeof vehicleEmissionFactor);
      console.log('vehicleCategory:', !!vehicleCategory, typeof vehicleCategory);
      console.log('vehicleSize:', !!vehicleSize, typeof vehicleSize);
      console.log('fuelType:', !!fuelType, typeof fuelType);
      console.log('publicTransport:', !!publicTransport, typeof publicTransport);

      // Get all vehicle emission factors with joins (exact same approach as working endpoint)
      const vehicleFactorsWithJoins = await db
        .select({
          id: vehicleEmissionFactor.id,
          categoryName: vehicleCategory.categoryName,
          sizeName: vehicleSize.sizeName,
          description: vehicleSize.description,
          fuelName: fuelType.fuelName,
          emissionValue: vehicleEmissionFactor.emissionValue,
          unit: vehicleEmissionFactor.unit
        })
        .from(vehicleEmissionFactor)
        .innerJoin(vehicleCategory, eq(vehicleEmissionFactor.categoryId, vehicleCategory.id))
        .innerJoin(vehicleSize, eq(vehicleEmissionFactor.sizeId, vehicleSize.id))
        .innerJoin(fuelType, eq(vehicleEmissionFactor.fuelId, fuelType.id))
        .orderBy(vehicleCategory.categoryName, vehicleSize.sizeName, fuelType.fuelName);

      // Get public transport factors
      publicTransportFactors = await db
        .select({
          id: publicTransport.id,
          transportType: publicTransport.transportType,
          emissionFactor: publicTransport.emissionFactor,
          unit: publicTransport.unit
        })
        .from(publicTransport);

      console.log('Database queries completed successfully');
      console.log('Vehicle factors with joins:', vehicleFactorsWithJoins.length);
      console.log('Public transport factors:', publicTransportFactors.length);

      // Use the joined data directly (same format as working emission factors endpoint)
      vehicleFactors = vehicleFactorsWithJoins;
      
      // Create lookup tables from the joined data
      const uniqueCategories = new Map();
      const uniqueSizes = new Map();
      const uniqueFuels = new Map();
      
      vehicleFactorsWithJoins.forEach(factor => {
        uniqueCategories.set(factor.categoryName, factor.categoryName);
        uniqueSizes.set(factor.sizeName, factor.sizeName);
        uniqueFuels.set(factor.fuelName, factor.fuelName);
      });
      
      categoryFactors = Array.from(uniqueCategories.keys()).map(name => ({ categoryName: name }));
      sizeFactors = Array.from(uniqueSizes.keys()).map(name => ({ sizeName: name }));
      fuelFactors = Array.from(uniqueFuels.keys()).map(name => ({ fuelName: name }));

    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({
        error: 'Database query failed',
        message: dbError.message,
        details: 'Failed to fetch emission factors from database'
      });
    }

    let totalEmissions = 0;
    const results = {
      privateTransport: { total: 0, breakdown: [] },
      publicTransport: { total: 0, breakdown: [] }
    };

    // Calculate private transport emissions
    if (privateTransport && privateTransport.length > 0) {
      try {
        results.privateTransport = calculatePrivateTransportEmissions(
          privateTransport, 
          vehicleFactors, 
          categoryFactors, 
          sizeFactors, 
          fuelFactors
        );
        totalEmissions += results.privateTransport.total;
      } catch (calcError) {
        console.error('Private transport calculation error:', calcError);
        return res.status(500).json({
          error: 'Private transport calculation failed',
          message: calcError.message,
          details: 'Error in calculatePrivateTransportEmissions function'
        });
      }
    }

    // Calculate public transport emissions
    if (publicTransport && publicTransport.length > 0) {
      try {
        results.publicTransport = calculatePublicTransportEmissions(publicTransport, publicTransportFactors);
        totalEmissions += results.publicTransport.total;
      } catch (calcError) {
        console.error('Public transport calculation error:', calcError);
        return res.status(500).json({
          error: 'Public transport calculation failed',
          message: calcError.message,
          details: 'Error in calculatePublicTransportEmissions function'
        });
      }
    }

    // Calculate tree saplings needed (total emissions / 60.5)
    const treeSaplings = (totalEmissions / 60.5).toFixed(2);

    res.json({
      success: true,
      totalEmissions: totalEmissions,
      treeSaplingsNeeded: treeSaplings,
      results: results
    });

  } catch (error) {
    console.error('Error calculating travel emissions:', error);
    res.status(500).json({ 
      error: 'Failed to calculate travel emissions',
      message: error.message 
    });
  }
});

// Calculate household carbon footprint
router.post('/calculate/household', async (req, res) => {
  try {
    const { 
      numberOfPeople = 1, 
      electricityUsage = 0, 
      waterUsage = 0, 
      wasteDisposal = 0 
    } = req.body;

    console.log('Household calculation request:', { numberOfPeople, electricityUsage, waterUsage, wasteDisposal });

    // Check if database is available
    if (!db) {
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'Database instance is not initialized'
      });
    }

    // Get household emission factors
    let householdFactorsData;
    try {
      householdFactorsData = await db.select().from(householdFactors);
      console.log('Household factors loaded:', householdFactorsData.length);
    } catch (dbError) {
      console.error('Database query error for household factors:', dbError);
      return res.status(500).json({
        error: 'Database query failed',
        message: dbError.message,
        details: 'Failed to fetch household emission factors'
      });
    }

    const householdData = {
      numberOfPeople,
      electricityUsage,
      waterUsage,
      wasteDisposal
    };

    let results;
    try {
      results = calculateHouseholdEmissions(householdData, householdFactorsData);
      console.log('Household calculation completed:', results);
    } catch (calcError) {
      console.error('Household calculation error:', calcError);
      return res.status(500).json({
        error: 'Household calculation failed',
        message: calcError.message,
        details: 'Error in calculateHouseholdEmissions function'
      });
    }

    // Calculate tree saplings needed (total emissions / 60.5)
    const treeSaplings = (results.total / 60.5).toFixed(2);

    res.json({
      success: true,
      totalMonthlyEmissions: results.total,
      treeSaplingsNeeded: treeSaplings,
      results: results
    });

  } catch (error) {
    console.error('Error calculating household emissions:', error);
    res.status(500).json({ 
      error: 'Failed to calculate household emissions',
      message: error.message 
    });
  }
});

// Calculate food carbon footprint
router.post('/calculate/food', async (req, res) => {
  try {
    const { foodItems = [] } = req.body;

    console.log('Food calculation request:', { foodItemsCount: foodItems?.length, foodItems });

    // If no food items, return zero emissions
    if (!foodItems || foodItems.length === 0) {
      return res.json({
        success: true,
        totalEmissions: 0,
        treeSaplingsNeeded: "0.00",
        results: {
          total: 0,
          breakdown: []
        }
      });
    }

    // Check if database is available
    if (!db) {
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'Database instance is not initialized'
      });
    }

    // Get food emission factors
    let foodFactors;
    try {
      foodFactors = await db.select().from(foodEmissionFactors);
      console.log('Food factors loaded:', foodFactors.length);
    } catch (dbError) {
      console.error('Database query error for food factors:', dbError);
      return res.status(500).json({
        error: 'Database query failed',
        message: dbError.message,
        details: 'Failed to fetch food emission factors'
      });
    }

    let results;
    try {
      results = calculateFoodEmissions(foodItems, foodFactors);
      console.log('Food calculation completed:', results);
    } catch (calcError) {
      console.error('Food calculation error:', calcError);
      return res.status(500).json({
        error: 'Food calculation failed',
        message: calcError.message,
        details: 'Error in calculateFoodEmissions function'
      });
    }

    // Calculate tree saplings needed (total emissions / 60.5)
    const treeSaplings = (results.total / 60.5).toFixed(2);

    res.json({
      success: true,
      totalEmissions: results.total,
      treeSaplingsNeeded: treeSaplings,
      results: results
    });

  } catch (error) {
    console.error('Error calculating food emissions:', error);
    res.status(500).json({ 
      error: 'Failed to calculate food emissions',
      message: error.message 
    });
  }
});

// Calculate shopping carbon footprint
router.post('/calculate/shopping', async (req, res) => {
  try {
    const { shoppingItems = [] } = req.body;

    console.log('Shopping calculation request:', { shoppingItemsCount: shoppingItems?.length, shoppingItems });

    // If no shopping items, return zero emissions
    if (!shoppingItems || shoppingItems.length === 0) {
      return res.json({
        success: true,
        totalEmissions: 0,
        treeSaplingsNeeded: "0.00",
        results: {
          total: 0,
          breakdown: []
        }
      });
    }

    // Check if database is available
    if (!db) {
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'Database instance is not initialized'
      });
    }

    // Get shopping emission factors
    let shoppingFactors;
    try {
      shoppingFactors = await db.select().from(shoppingEmissionFactors);
      console.log('Shopping factors loaded:', shoppingFactors.length);
    } catch (dbError) {
      console.error('Database query error for shopping factors:', dbError);
      return res.status(500).json({
        error: 'Database query failed',
        message: dbError.message,
        details: 'Failed to fetch shopping emission factors'
      });
    }

    let results;
    try {
      results = calculateShoppingEmissions(shoppingItems, shoppingFactors);
      console.log('Shopping calculation completed:', results);
    } catch (calcError) {
      console.error('Shopping calculation error:', calcError);
      return res.status(500).json({
        error: 'Shopping calculation failed',
        message: calcError.message,
        details: 'Error in calculateShoppingEmissions function'
      });
    }

    // Calculate tree saplings needed (total emissions / 60.5)
    const treeSaplings = (results.total / 60.5).toFixed(2);

    res.json({
      success: true,
      totalEmissions: results.total,
      treeSaplingsNeeded: treeSaplings,
      results: results
    });

  } catch (error) {
    console.error('Error calculating shopping emissions:', error);
    res.status(500).json({ 
      error: 'Failed to calculate shopping emissions',
      message: error.message 
    });
  }
});

// ===== CALCULATION HELPER FUNCTIONS =====

function calculatePrivateTransportEmissions(transportData, vehicleFactors, categoryFactors, sizeFactors, fuelFactors) {
  let total = 0;
  const breakdown = [];

  console.log('calculatePrivateTransportEmissions called with:');
  console.log('transportData:', transportData);
  console.log('vehicleFactors count:', vehicleFactors.length);
  console.log('categoryFactors count:', categoryFactors.length);
  console.log('sizeFactors count:', sizeFactors.length);
  console.log('fuelFactors count:', fuelFactors.length);

  for (const item of transportData) {
    const { vehicleType = '', vehicleSize = '', fuelType = '', distance = 0 } = item;
    
    console.log('Processing item:', { vehicleType, vehicleSize, fuelType, distance });
    
    // Skip items with missing required fields or zero distance
    if (!vehicleType || !vehicleSize || !fuelType || distance <= 0) {
      console.log('Skipping item due to missing fields or zero distance:', { vehicleType, vehicleSize, fuelType, distance });
      continue;
    }
    
    // Find matching emission factor by looking up names directly
    const factor = vehicleFactors.find(f => 
      f.categoryName === vehicleType && 
      f.sizeName === vehicleSize && 
      f.fuelName === fuelType
    );
    
    console.log('Found factor:', factor ? 'Yes' : 'No');
    console.log('Looking for:', { vehicleType, vehicleSize, fuelType });

    if (factor) {
      const emissions = distance * parseFloat(factor.emissionValue);
      total += emissions;
      
      breakdown.push({
        vehicleType,
        vehicleSize,
        fuelType,
        distance,
        emissionFactor: factor.emissionValue,
        unit: factor.unit,
        emissions: emissions
      });
    } else {
      console.log('No matching emission factor found for:', { vehicleType, vehicleSize, fuelType });
    }
  }

  return { total, breakdown };
}

function calculatePublicTransportEmissions(transportData, factors) {
  let total = 0;
  const breakdown = [];

  for (const item of transportData) {
    const { transportType, distance } = item;
    
    // Find matching emission factor
    const factor = factors.find(f => f.transportType === transportType);

    if (factor) {
      const emissions = distance * parseFloat(factor.emissionFactor);
      total += emissions;
      
      breakdown.push({
        transportType,
        distance,
        emissionFactor: factor.emissionFactor,
        emissions: emissions
      });
    }
  }

  return { total, breakdown };
}

function calculateHouseholdEmissions(householdData, factors) {
  let total = 0;
  const breakdown = [];
  
  const { 
    numberOfPeople, 
    electricityUsage, // kWh per month
    waterUsage,       // m³ per month
    wasteDisposal     // kg per week
  } = householdData;

  // 1. Average household emissions (divided by number of people)
  const averageHouseholdFactor = factors.find(f => f.factorName === 'Average household');
  if (averageHouseholdFactor) {
    const monthlyEmissions = (parseFloat(averageHouseholdFactor.emissionFactor) / numberOfPeople) * 30; // Convert daily to monthly
    total += monthlyEmissions;
    
    breakdown.push({
      category: 'Average Household',
      factor: 'Per Person',
      numberOfPeople: numberOfPeople,
      dailyEmissionFactor: averageHouseholdFactor.emissionFactor,
      monthlyEmissions: monthlyEmissions
    });
  }

  // 2. Electricity usage (already monthly)
  const electricityFactor = factors.find(f => f.factorName === 'Electricity Peninsular');
  if (electricityFactor) {
    const monthlyEmissions = electricityUsage * parseFloat(electricityFactor.emissionFactor);
    total += monthlyEmissions;
    
    breakdown.push({
      category: 'Electricity',
      factor: 'kWh',
      monthlyUsage: electricityUsage,
      emissionFactor: electricityFactor.emissionFactor,
      monthlyEmissions: monthlyEmissions
    });
  }

  // 3. Water usage (already monthly)
  const waterFactor = factors.find(f => f.factorName === 'Water');
  if (waterFactor) {
    const monthlyEmissions = waterUsage * parseFloat(waterFactor.emissionFactor);
    total += monthlyEmissions;
    
    breakdown.push({
      category: 'Water',
      factor: 'm³',
      monthlyUsage: waterUsage,
      emissionFactor: waterFactor.emissionFactor,
      monthlyEmissions: monthlyEmissions
    });
  }

  // 4. Waste disposal (convert weekly to monthly)
  const wasteFactor = factors.find(f => f.factorName === 'Household residual waste');
  if (wasteFactor) {
    const monthlyWasteUsage = wasteDisposal * 4; // Convert weekly to monthly
    const monthlyEmissions = monthlyWasteUsage * parseFloat(wasteFactor.emissionFactor);
    total += monthlyEmissions;
    
    breakdown.push({
      category: 'Waste Disposal',
      factor: 'kg',
      weeklyUsage: wasteDisposal,
      monthlyUsage: monthlyWasteUsage,
      emissionFactor: wasteFactor.emissionFactor,
      monthlyEmissions: monthlyEmissions
    });
  }

  return { total, breakdown };
}

function calculateFoodEmissions(foodItems, factors) {
  let total = 0;
  const breakdown = [];

  for (const item of foodItems) {
    const { foodType = '', quantity = 0, unit = '' } = item;
    
    // Skip items with missing required fields or zero quantity
    if (!foodType || !unit || quantity <= 0) {
      continue;
    }
    
    const factor = factors.find(f => f.name === foodType && f.unit === unit);

    if (factor) {
      const emissions = quantity * parseFloat(factor.value);
      total += emissions;
      
      breakdown.push({
        foodType,
        quantity,
        unit,
        emissionFactor: factor.value,
        emissions: emissions
      });
    }
  }

  return { total, breakdown };
}

function calculateShoppingEmissions(shoppingItems, factors) {
  let total = 0;
  const breakdown = [];

  for (const item of shoppingItems) {
    const { category = '', subcategory = '', quantity = 0, unit = '' } = item;
    
    // Skip items with missing required fields or zero quantity
    if (!category || !subcategory || !unit || quantity <= 0) {
      continue;
    }
    
    const factor = factors.find(f => 
      f.category === category && f.subcategory === subcategory && f.unit === unit
    );

    if (factor) {
      const emissions = quantity * parseFloat(factor.value);
      total += emissions;
      
      breakdown.push({
        category,
        subcategory,
        quantity,
        unit,
        emissionFactor: parseFloat(factor.value),
        emissions: emissions
      });
    }
  }

  return { total, breakdown };
}

// ===== EMISSION FACTOR ENDPOINTS =====

// Get emission factors for food
router.get('/emission-factors/food', async (req, res) => {
  try {
    console.log('Fetching food emission factors...');
    
    if (!db) {
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'Database instance is not initialized'
      });
    }

    const result = await db
      .select({
        id: foodEntities.id,
        name: foodEntities.name,
        subcategory: foodSubcategories.name,
        category: foodCategories.name,
        value: foodEmissionFactors.value,
        unit: foodEmissionFactors.unit
      })
      .from(foodEntities)
      .innerJoin(foodSubcategories, eq(foodEntities.subcategoryId, foodSubcategories.id))
      .innerJoin(foodCategories, eq(foodSubcategories.categoryId, foodCategories.id))
      .innerJoin(foodEmissionFactors, eq(foodEntities.id, foodEmissionFactors.entityId))
      .orderBy(foodCategories.name, foodSubcategories.name, foodEntities.name);

    console.log('Food emission factors fetched:', result.length);
    res.json({
      success: true,
      data: result,
      count: result.length
    });

  } catch (error) {
    console.error('Error fetching food emission factors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch food emission factors',
      message: error.message,
      details: 'Database query failed for food emission factors'
    });
  }
});

// Get emission factors for shopping
router.get('/emission-factors/shopping', async (req, res) => {
  try {
    const result = await db
      .select({
        id: shoppingEntities.id,
        name: shoppingEntities.name,
        subcategory: shoppingSubcategories.name,
        category: shoppingCategories.name,
        value: shoppingEmissionFactors.value,
        unit: shoppingEmissionFactors.unit
      })
      .from(shoppingEntities)
      .innerJoin(shoppingSubcategories, eq(shoppingEntities.subcategoryId, shoppingSubcategories.id))
      .innerJoin(shoppingCategories, eq(shoppingSubcategories.categoryId, shoppingCategories.id))
      .innerJoin(shoppingEmissionFactors, eq(shoppingEntities.id, shoppingEmissionFactors.entityId))
      .orderBy(shoppingCategories.name, shoppingSubcategories.name, shoppingEntities.name);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching shopping emission factors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shopping emission factors',
      message: error.message 
    });
  }
});

// Get vehicle emission factors
router.get('/emission-factors/vehicles', async (req, res) => {
  try {
    const result = await db
      .select({
        id: vehicleEmissionFactor.id,
        categoryName: vehicleCategory.categoryName,
        sizeName: vehicleSize.sizeName,
        description: vehicleSize.description,
        fuelName: fuelType.fuelName,
        emissionValue: vehicleEmissionFactor.emissionValue,
        unit: vehicleEmissionFactor.unit
      })
      .from(vehicleEmissionFactor)
      .innerJoin(vehicleCategory, eq(vehicleEmissionFactor.categoryId, vehicleCategory.id))
      .innerJoin(vehicleSize, eq(vehicleEmissionFactor.sizeId, vehicleSize.id))
      .innerJoin(fuelType, eq(vehicleEmissionFactor.fuelId, fuelType.id))
      .orderBy(vehicleCategory.categoryName, vehicleSize.sizeName, fuelType.fuelName);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching vehicle emission factors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vehicle emission factors',
      message: error.message 
    });
  }
});

// Get public transport emission factors
router.get('/emission-factors/public-transport', async (req, res) => {
  try {
    const result = await db
      .select({
        id: publicTransport.id,
        transportType: publicTransport.transportType,
        emissionFactor: publicTransport.emissionFactor,
        unit: publicTransport.unit,
        fuelName: fuelType.fuelName
      })
      .from(publicTransport)
      .innerJoin(fuelType, eq(publicTransport.fuelId, fuelType.id))
      .orderBy(publicTransport.transportType);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching public transport emission factors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch public transport emission factors',
      message: error.message 
    });
  }
});

// Get household emission factors
router.get('/emission-factors/household', async (req, res) => {
  try {
    const result = await db
      .select({
        id: householdFactors.id,
        factorName: householdFactors.factorName,
        categoryName: householdFactorCategory.categoryName,
        regionName: region.regionName,
        unit: householdFactors.unit,
        emissionFactor: householdFactors.emissionFactor,
        description: householdFactors.description
      })
      .from(householdFactors)
      .innerJoin(householdFactorCategory, eq(householdFactors.categoryId, householdFactorCategory.id))
      .leftJoin(region, eq(householdFactors.regionId, region.id))
      .orderBy(householdFactorCategory.categoryName, householdFactors.factorName);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching household emission factors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch household emission factors',
      message: error.message 
    });
  }
});

// Delete calculation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(carbonFootprintCalculations)
      .where(eq(carbonFootprintCalculations.id, parseInt(id)))
      .returning({ id: carbonFootprintCalculations.id });

    if (result.length === 0) {
      return res.status(404).json({ error: 'Calculation not found' });
    }

    res.json({
      success: true,
      message: 'Calculation deleted successfully',
      deletedId: result[0].id
    });

  } catch (error) {
    console.error('Error deleting calculation:', error);
    res.status(500).json({ 
      error: 'Failed to delete calculation',
      message: error.message 
    });
  }
});

export default router;
