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

    // Validate input data
    const validationErrors = [];
    
    // Validate private transport data
    if (privateTransport && privateTransport.length > 0) {
      const validVehicleTypes = ['car', 'motorbike'];
      const validSizes = ['small', 'medium', 'large', 'average'];
      const validFuelTypes = ['diesel', 'petrol', 'hybrid', 'phev', 'bev', 'electric'];
      
      privateTransport.forEach((item, index) => {
        if (!validVehicleTypes.includes(item.vehicleType?.toLowerCase())) {
          validationErrors.push(`Private transport item ${index + 1}: Invalid vehicleType. Must be one of: Car, Motorbike`);
        }
        if (!validSizes.includes(item.vehicleSize?.toLowerCase())) {
          validationErrors.push(`Private transport item ${index + 1}: Invalid vehicleSize. Must be one of: small, medium, large, average`);
        }
        if (!validFuelTypes.includes(item.fuelType?.toLowerCase())) {
          validationErrors.push(`Private transport item ${index + 1}: Invalid fuelType. Must be one of: diesel, petrol, hybrid, PHEV, BEV, electric`);
        }
        if (!item.distance || item.distance <= 0) {
          validationErrors.push(`Private transport item ${index + 1}: Distance must be a positive number`);
        }
      });
    }
    
    // Validate public transport data
    if (publicTransport && publicTransport.length > 0) {
      const validTransportTypes = ['bus', 'mrt', 'lrt', 'monorail', 'ktm', 'average train'];
      
      publicTransport.forEach((item, index) => {
        if (!validTransportTypes.includes(item.transportType?.toLowerCase())) {
          validationErrors.push(`Public transport item ${index + 1}: Invalid transportType. Must be one of: Bus, MRT, LRT, Monorail, KTM, Average train`);
        }
        if (!item.distance || item.distance <= 0) {
          validationErrors.push(`Public transport item ${index + 1}: Distance must be a positive number`);
        }
      });
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: validationErrors
      });
    }

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
      // Use raw SQL query to avoid Drizzle ORM issues
      console.log('Travel calculator - Getting vehicle factors with raw SQL...');
      
      const vehicleFactorsWithJoins = await db.execute(sql`
        SELECT 
          vef.id,
          vc.category_name as "categoryName",
          vs.size_name as "sizeName",
          vs.description,
          ft.fuel_name as "fuelName",
          vef.emission_value as "emissionValue",
          vef.unit
        FROM vehicle_emission_factor vef
        INNER JOIN vehicle_category vc ON vef.category_id = vc.id
        INNER JOIN vehicle_size vs ON vef.size_id = vs.id
        INNER JOIN fuel_type ft ON vef.fuel_id = ft.id
        ORDER BY vc.category_name, vs.size_name, ft.fuel_name
      `);

      // Get public transport factors with raw SQL
      publicTransportFactors = await db.execute(sql`
        SELECT 
          id,
          transport_type as "transportType",
          emission_factor as "emissionFactor",
          unit
        FROM public_transport
      `);

      console.log('Database queries completed successfully');
      console.log('Vehicle factors with joins:', vehicleFactorsWithJoins.rows.length);
      console.log('Public transport factors:', publicTransportFactors.rows.length);

      // Use the joined data directly (raw SQL returns .rows array)
      vehicleFactors = vehicleFactorsWithJoins.rows;
      publicTransportFactors = publicTransportFactors.rows;
      
      // Create lookup tables from the joined data
      const uniqueCategories = new Map();
      const uniqueSizes = new Map();
      const uniqueFuels = new Map();
      
      vehicleFactorsWithJoins.rows.forEach(factor => {
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

    // Validate input data
    const validationErrors = [];
    if (!numberOfPeople || numberOfPeople < 1) {
      validationErrors.push('numberOfPeople must be a positive number');
    }
    if (electricityUsage < 0) {
      validationErrors.push('electricityUsage must be a non-negative number');
    }
    if (waterUsage < 0) {
      validationErrors.push('waterUsage must be a non-negative number');
    }
    if (wasteDisposal < 0) {
      validationErrors.push('wasteDisposal must be a non-negative number');
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: validationErrors
      });
    }

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

    // Validate food items - check if foodType exists in our database
    const validationErrors = [];
    
    foodItems.forEach((item, index) => {
      if (!item.foodType) {
        validationErrors.push(`Food item ${index + 1}: foodType is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        validationErrors.push(`Food item ${index + 1}: quantity must be a positive number`);
      }
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid food item data',
        details: validationErrors
      });
    }

    // Check if database is available
    if (!db) {
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'Database instance is not initialized'
      });
    }

    // Get food data for subcategory-based calculations
    let foodData;
    try {
      foodData = await db
        .select({
          entityId: foodEntities.id,
          entityName: foodEntities.name,
          subcategoryId: foodEntities.subcategoryId,
          subcategoryName: foodSubcategories.name,
          averageEmission: foodSubcategories.averageEmission,
          emissionValue: foodEmissionFactors.value
        })
        .from(foodEntities)
        .innerJoin(foodSubcategories, eq(foodEntities.subcategoryId, foodSubcategories.id))
        .leftJoin(foodEmissionFactors, eq(foodEntities.id, foodEmissionFactors.entityId));
      
      console.log('Food data loaded:', foodData.length);
    } catch (dbError) {
      console.error('Database query error for food data:', dbError);
      return res.status(500).json({
        error: 'Database query failed',
        message: dbError.message,
        details: 'Failed to fetch food data'
      });
    }

    let results;
    try {
      results = calculateFoodEmissionsBySubcategory(foodItems, foodData);
      console.log('Food calculation completed:', results);
    } catch (calcError) {
      console.error('Food calculation error:', calcError);
      return res.status(500).json({
        error: 'Food calculation failed',
        message: calcError.message,
        details: 'Error in calculateFoodEmissionsBySubcategory function'
      });
    }

    // Calculate tree saplings needed (total emissions / 60.5)
    const treeSaplings = (results.total / 60.5).toFixed(2);

    res.json({
      success: true,
      totalEmissions: results.total,
      treeSaplingsNeeded: treeSaplings,
      results: {
        total: results.total,
        breakdown: results.breakdown,
        groups: {
          'fruits-vegetables': {
            name: results.groups['fruits-vegetables'].name,
            total: results.groups['fruits-vegetables'].total,
            breakdown: results.groups['fruits-vegetables'].breakdown
          },
          'poultry-redmeats-seafood': {
            name: results.groups['poultry-redmeats-seafood'].name,
            total: results.groups['poultry-redmeats-seafood'].total,
            breakdown: results.groups['poultry-redmeats-seafood'].breakdown
          },
          'staples-grain': {
            name: results.groups['staples-grain'].name,
            total: results.groups['staples-grain'].total,
            breakdown: results.groups['staples-grain'].breakdown
          },
          'processed-dairy': {
            name: results.groups['processed-dairy'].name,
            total: results.groups['processed-dairy'].total,
            breakdown: results.groups['processed-dairy'].breakdown
          }
        }
      }
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
          breakdown: [],
          groups: {}
        }
      });
    }

    // Validate shopping items
    const validationErrors = [];
    
    shoppingItems.forEach((item, index) => {
      if (!item.type || typeof item.type !== 'string') {
        validationErrors.push(`Shopping item ${index + 1}: type is required and must be a string`);
      }
      if (!item.quantity || item.quantity <= 0) {
        validationErrors.push(`Shopping item ${index + 1}: quantity must be a positive number`);
      }
      // If type is "average", subcategoryGroup is required
      if (item.type?.toLowerCase() === 'average' && !item.subcategoryGroup) {
        validationErrors.push(`Shopping item ${index + 1}: subcategoryGroup is required when type is "average"`);
      }
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid shopping item data',
        details: validationErrors
      });
    }

    // Check if database is available
    if (!db) {
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'Database instance is not initialized'
      });
    }

    // Get shopping data with entities, subcategories, and emission factors
    let shoppingData;
    try {
      shoppingData = await db
        .select({
          entityId: shoppingEntities.id,
          entityName: shoppingEntities.name,
          subcategoryId: shoppingEntities.subcategoryId,
          subcategoryName: shoppingSubcategories.name,
          emissionValue: shoppingEmissionFactors.value,
          averageEmission: shoppingSubcategories.averageEmission
        })
        .from(shoppingEntities)
        .innerJoin(shoppingSubcategories, eq(shoppingEntities.subcategoryId, shoppingSubcategories.id))
        .leftJoin(shoppingEmissionFactors, eq(shoppingEntities.id, shoppingEmissionFactors.entityId));
      
      console.log('Shopping data loaded:', shoppingData.length);
    } catch (dbError) {
      console.error('Database query error for shopping data:', dbError);
      return res.status(500).json({
        error: 'Database query failed',
        message: dbError.message,
        details: 'Failed to fetch shopping data'
      });
    }

    let results;
    try {
      results = calculateShoppingEmissionsBySubcategory(shoppingItems, shoppingData);
      console.log('Shopping calculation completed:', results);
    } catch (calcError) {
      console.error('Shopping calculation error:', calcError);
      return res.status(500).json({
        error: 'Shopping calculation failed',
        message: calcError.message,
        details: 'Error in calculateShoppingEmissionsBySubcategory function'
      });
    }

    // Calculate tree saplings needed (1 tree = 22 kg CO2e per year)
    const treeSaplingsNeeded = (results.total / 22).toFixed(2);

    res.json({
      success: true,
      totalEmissions: results.total,
      treeSaplingsNeeded: treeSaplingsNeeded,
      results: results
    });

  } catch (error) {
    console.error('Shopping calculation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong'
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
    
    // Find matching emission factor by looking up names directly (case-insensitive with null checks)
    const factor = vehicleFactors.find(f => 
      f.categoryName && f.sizeName && f.fuelName &&
      f.categoryName.toLowerCase() === vehicleType?.toLowerCase() && 
      f.sizeName.toLowerCase() === vehicleSize?.toLowerCase() && 
      f.fuelName.toLowerCase() === fuelType?.toLowerCase()
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
    
    // Find matching emission factor (case-insensitive with null checks)
    const factor = factors.find(f => f.transportType && f.transportType.toLowerCase() === transportType?.toLowerCase());

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
  const averageHouseholdFactor = factors.find(f => f.factorName && f.factorName.toLowerCase() === 'average household');
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

  // 2. Electricity usage (already monthly) - use default Peninsular factor
  const electricityFactor = factors.find(f => f.factorName && f.factorName.toLowerCase() === 'electricity peninsular');
  
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
  const waterFactor = factors.find(f => f.factorName && f.factorName.toLowerCase() === 'water');
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
  const wasteFactor = factors.find(f => f.factorName && f.factorName.toLowerCase() === 'household residual waste');
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
    
    // Case-insensitive matching - convert both to lowercase (with null checks)
    // Note: Only match by name, not unit, since all food items use "kg CO2e/kg" in database
    const factor = factors.find(f => 
      f.name && f.name.toLowerCase() === foodType?.toLowerCase()
    );

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

function calculateFoodEmissionsBySubcategory(foodItems, foodData) {
  // Define the 4 subcategory groups
  const subcategoryGroups = {
    'fruits-vegetables': {
      name: 'Fruits, Vegetables',
      subcategoryIds: [2, 3], // Fruits, Vegetables
      total: 0,
      breakdown: []
    },
    'poultry-redmeats-seafood': {
      name: 'Poultry, Red Meats, Seafood',
      subcategoryIds: [7, 4, 8], // Poultry, Red Meats, Seafood
      total: 0,
      breakdown: []
    },
    'staples-grain': {
      name: 'Staples, Grain',
      subcategoryIds: [9, 5], // Staples, Grains
      total: 0,
      breakdown: []
    },
    'processed-dairy': {
      name: 'Processed Foods and Other, Dairy',
      subcategoryIds: [1, 6], // Processed Foods and Other, Dairy
      total: 0,
      breakdown: []
    }
  };

  let grandTotal = 0;
  const allBreakdown = [];

  for (const item of foodItems) {
    const { foodType = '', quantity = 0 } = item;
    
    // Skip items with missing required fields or zero quantity
    if (!foodType || quantity <= 0) {
      continue;
    }

    // Assume quantity is already in kg
    const quantityInKg = quantity;

    let emissions = 0;
    let emissionFactor = 0;
    let subcategoryName = '';
    let groupName = '';

    let foodEntity = null;

    // Check if foodType is "average" - use subcategory average
    if (foodType.toLowerCase() === 'average') {
      // For average, we need to determine which subcategory group this belongs to
      // Check if there's a subcategoryGroup parameter in the item
      const subcategoryGroup = item.subcategoryGroup;
      
      if (!subcategoryGroup) {
        // Skip items without subcategory group specification
        continue;
      }

      // Find the specific subcategory by name (case-insensitive)
      foodEntity = foodData.find(f =>
        f.subcategoryName && f.subcategoryName.toLowerCase().trim() === subcategoryGroup.toLowerCase().trim()
      );

      if (foodEntity) {
        emissionFactor = foodEntity.averageEmission;
        subcategoryName = foodEntity.subcategoryName;
        
        // Find which group this subcategory belongs to
        for (const [groupKey, group] of Object.entries(subcategoryGroups)) {
          if (group.subcategoryIds.includes(foodEntity.subcategoryId)) {
            groupName = group.name;
            break;
          }
        }
      } else {
        continue;
      }
    } else {
      // Find the specific food entity (case insensitive)
      foodEntity = foodData.find(f => 
        f.entityName && f.entityName.toLowerCase() === foodType.toLowerCase()
      );

      if (foodEntity) {
        // Use specific entity emission factor if available, otherwise use subcategory average
        emissionFactor = foodEntity.emissionValue || foodEntity.averageEmission;
        subcategoryName = foodEntity.subcategoryName;
        
        // Find which group this subcategory belongs to
        for (const [groupKey, group] of Object.entries(subcategoryGroups)) {
          if (group.subcategoryIds.includes(foodEntity.subcategoryId)) {
            groupName = group.name;
            break;
          }
        }
      } else {
        // Food entity not found
        continue;
      }
    }

    if (emissionFactor > 0) {
      emissions = quantityInKg * parseFloat(emissionFactor);
      grandTotal += emissions;

      // Add to the appropriate group
      for (const [groupKey, group] of Object.entries(subcategoryGroups)) {
        if (group.subcategoryIds.includes(foodEntity.subcategoryId)) {
          group.total += emissions;
          group.breakdown.push({
            foodType,
            quantity,
            subcategory: subcategoryName,
            emissionFactor: emissionFactor,
            emissions: emissions
          });
          break;
        }
      }

      // Add to overall breakdown
      allBreakdown.push({
        foodType,
        quantity,
        subcategory: subcategoryName,
        group: groupName,
        emissionFactor: emissionFactor,
        emissions: emissions
      });
    }
  }

  return {
    total: grandTotal,
    breakdown: allBreakdown,
    groups: subcategoryGroups
  };
}

function calculateShoppingEmissionsBySubcategory(shoppingItems, shoppingData) {
  const subcategoryGroups = {
    'groceries-beverages': {
      name: 'Groceries & Beverages',
      subcategoryIds: [2], // Groceries & Beverages
      total: 0,
      breakdown: []
    },
    'home-garden-appliances-entertainment-general': {
      name: 'Home & Garden, Appliances & Electronics, Entertainment, General Merchandise',
      subcategoryIds: [6, 7, 8, 1], // Home & Garden, Appliances & Electronics, Entertainment, General Merchandise
      total: 0,
      breakdown: []
    },
    'clothing-accessories-health-pharmacy': {
      name: 'Clothing, Accessories, Health & Pharmacy',
      subcategoryIds: [3, 4, 5], // Clothing, Accessories, Health & Pharmacy
      total: 0,
      breakdown: []
    }
  };

  let grandTotal = 0;
  const allBreakdown = [];

  for (const item of shoppingItems) {
    const { type = '', quantity = 0 } = item;

    if (!type || quantity <= 0) {
      continue;
    }

    const quantityInRM = quantity; // Assume quantity is already in RM

    let emissions = 0;
    let emissionFactor = 0;
    let subcategoryName = '';
    let groupName = '';

    let shoppingEntity = null;

    if (type.toLowerCase() === 'average') {
      const subcategoryGroup = item.subcategoryGroup;

      if (!subcategoryGroup) {
        continue;
      }

      // Find the specific subcategory by name (case-insensitive)
      shoppingEntity = shoppingData.find(s =>
        s.subcategoryName && s.subcategoryName.toLowerCase().trim() === subcategoryGroup.toLowerCase().trim()
      );

      if (shoppingEntity) {
        emissionFactor = shoppingEntity.averageEmission;
        subcategoryName = shoppingEntity.subcategoryName;
        
        // Find which group this subcategory belongs to
        for (const [groupKey, group] of Object.entries(subcategoryGroups)) {
          if (group.subcategoryIds.includes(shoppingEntity.subcategoryId)) {
            groupName = group.name;
            break;
          }
        }
      } else {
        continue;
      }
    } else {
      shoppingEntity = shoppingData.find(s =>
        s.entityName && s.entityName.toLowerCase() === type.toLowerCase()
      );

      if (shoppingEntity) {
        emissionFactor = shoppingEntity.emissionValue || shoppingEntity.averageEmission;
        subcategoryName = shoppingEntity.subcategoryName;

        for (const [groupKey, group] of Object.entries(subcategoryGroups)) {
          if (group.subcategoryIds.includes(shoppingEntity.subcategoryId)) {
            groupName = group.name;
            break;
          }
        }
      } else {
        continue;
      }
    }

    if (emissionFactor > 0) {
      emissions = quantityInRM * parseFloat(emissionFactor);
      grandTotal += emissions;

      for (const [groupKey, group] of Object.entries(subcategoryGroups)) {
        if (group.subcategoryIds.includes(shoppingEntity.subcategoryId)) {
          group.total += emissions;
          group.breakdown.push({
            type,
            quantity,
            subcategory: subcategoryName,
            emissionFactor: emissionFactor,
            emissions: emissions
          });
          break;
        }
      }

      allBreakdown.push({
        type,
        quantity,
        subcategory: subcategoryName,
        group: groupName,
        emissionFactor: emissionFactor,
        emissions: emissions
      });
    }
  }

  return {
    total: grandTotal,
    breakdown: allBreakdown,
    groups: subcategoryGroups
  };
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

// Food dropdown APIs based on subcategories

// 1. Fruits, Vegetables API
router.get('/food-dropdown/fruits-vegetables', async (req, res) => {
  try {
    console.log('Fetching fruits and vegetables entities...');
    
    if (!db) {
      return res.status(500).json({
        error: 'Database not available',
        message: 'Database connection failed'
      });
    }

    const entities = await db
      .select({
        id: foodEntities.id,
        name: foodEntities.name,
        subcategory: foodSubcategories.name
      })
      .from(foodEntities)
      .innerJoin(foodSubcategories, eq(foodEntities.subcategoryId, foodSubcategories.id))
      .where(sql`${foodEntities.subcategoryId} IN (2, 3)`) // Fruits (2), Vegetables (3)
      .orderBy(foodEntities.name);

    res.json({
      success: true,
      data: entities,
      count: entities.length,
      subcategories: ['Fruits', 'Vegetables']
    });
  } catch (error) {
    console.error('Error fetching fruits and vegetables:', error);
    res.status(500).json({
      error: 'Failed to fetch fruits and vegetables',
      message: error.message
    });
  }
});

// 2. Poultry, Red Meats, Seafood API
router.get('/food-dropdown/poultry-redmeats-seafood', async (req, res) => {
  try {
    console.log('Fetching poultry, red meats, and seafood entities...');
    
    if (!db) {
      return res.status(500).json({
        error: 'Database not available',
        message: 'Database connection failed'
      });
    }

    const entities = await db
      .select({
        id: foodEntities.id,
        name: foodEntities.name,
        subcategory: foodSubcategories.name
      })
      .from(foodEntities)
      .innerJoin(foodSubcategories, eq(foodEntities.subcategoryId, foodSubcategories.id))
      .where(sql`${foodEntities.subcategoryId} IN (7, 4, 8)`) // Poultry (7), Red Meats (4), Seafood (8)
      .orderBy(foodEntities.name);

    res.json({
      success: true,
      data: entities,
      count: entities.length,
      subcategories: ['Poultry', 'Red Meats', 'Seafood']
    });
  } catch (error) {
    console.error('Error fetching poultry, red meats, and seafood:', error);
    res.status(500).json({
      error: 'Failed to fetch poultry, red meats, and seafood',
      message: error.message
    });
  }
});

// 3. Staples, Grain API
router.get('/food-dropdown/staples-grain', async (req, res) => {
  try {
    console.log('Fetching staples and grain entities...');
    
    if (!db) {
      return res.status(500).json({
        error: 'Database not available',
        message: 'Database connection failed'
      });
    }

    const entities = await db
      .select({
        id: foodEntities.id,
        name: foodEntities.name,
        subcategory: foodSubcategories.name
      })
      .from(foodEntities)
      .innerJoin(foodSubcategories, eq(foodEntities.subcategoryId, foodSubcategories.id))
      .where(sql`${foodEntities.subcategoryId} IN (9, 5)`) // Staples (9), Grains (5)
      .orderBy(foodEntities.name);

    res.json({
      success: true,
      data: entities,
      count: entities.length,
      subcategories: ['Staples', 'Grains']
    });
  } catch (error) {
    console.error('Error fetching staples and grain:', error);
    res.status(500).json({
      error: 'Failed to fetch staples and grain',
      message: error.message
    });
  }
});

// 4. Processed Foods and Other, Dairy API
router.get('/food-dropdown/processed-dairy', async (req, res) => {
  try {
    console.log('Fetching processed foods and dairy entities...');
    
    if (!db) {
      return res.status(500).json({
        error: 'Database not available',
        message: 'Database connection failed'
      });
    }

    const entities = await db
      .select({
        id: foodEntities.id,
        name: foodEntities.name,
        subcategory: foodSubcategories.name
      })
      .from(foodEntities)
      .innerJoin(foodSubcategories, eq(foodEntities.subcategoryId, foodSubcategories.id))
      .where(sql`${foodEntities.subcategoryId} IN (1, 6)`) // Processed Foods and Other (1), Dairy (6)
      .orderBy(foodEntities.name);

    res.json({
      success: true,
      data: entities,
      count: entities.length,
      subcategories: ['Processed Foods and Other', 'Dairy']
    });
  } catch (error) {
    console.error('Error fetching processed foods and dairy:', error);
    res.status(500).json({
      error: 'Failed to fetch processed foods and dairy',
      message: error.message
    });
  }
});

// Shopping dropdown APIs based on subcategories

// 1. Groceries & Beverages API
router.get('/shopping-dropdown/groceries-beverages', async (req, res) => {
  try {
    console.log('Fetching groceries and beverages entities...');
    
    if (!db) {
      return res.status(500).json({
        error: 'Database not available',
        message: 'Database connection failed'
      });
    }

    const entities = await db
      .select({
        id: shoppingEntities.id,
        name: shoppingEntities.name,
        subcategory: shoppingSubcategories.name
      })
      .from(shoppingEntities)
      .innerJoin(shoppingSubcategories, eq(shoppingEntities.subcategoryId, shoppingSubcategories.id))
      .where(sql`${shoppingEntities.subcategoryId} = 2`) // Groceries & Beverages (2)
      .orderBy(shoppingEntities.name);

    res.json({
      success: true,
      data: entities,
      count: entities.length,
      subcategories: ['Groceries & Beverages']
    });
  } catch (error) {
    console.error('Error fetching groceries and beverages:', error);
    res.status(500).json({
      error: 'Failed to fetch groceries and beverages',
      message: error.message
    });
  }
});

// 2. Home & Garden, Home Appliances & Electronics, Entertainment, General Merchandise API
router.get('/shopping-dropdown/home-garden-appliances-entertainment-general', async (req, res) => {
  try {
    console.log('Fetching home, garden, appliances, entertainment, and general merchandise entities...');
    
    if (!db) {
      return res.status(500).json({
        error: 'Database not available',
        message: 'Database connection failed'
      });
    }

    const entities = await db
      .select({
        id: shoppingEntities.id,
        name: shoppingEntities.name,
        subcategory: shoppingSubcategories.name
      })
      .from(shoppingEntities)
      .innerJoin(shoppingSubcategories, eq(shoppingEntities.subcategoryId, shoppingSubcategories.id))
      .where(sql`${shoppingEntities.subcategoryId} IN (6, 7, 8, 1)`) // Home & Garden (6), Home Appliances & Electronics (7), Entertainment (8), General Merchandise (1)
      .orderBy(shoppingEntities.name);

    res.json({
      success: true,
      data: entities,
      count: entities.length,
      subcategories: ['Home & Garden', 'Home, Appliances & Electronics', 'Entertainment', 'General Merchandise']
    });
  } catch (error) {
    console.error('Error fetching home, garden, appliances, entertainment, and general merchandise:', error);
    res.status(500).json({
      error: 'Failed to fetch home, garden, appliances, entertainment, and general merchandise',
      message: error.message
    });
  }
});

// 3. Clothing, Accessories, Health & Pharmacy API
router.get('/shopping-dropdown/clothing-accessories-health-pharmacy', async (req, res) => {
  try {
    console.log('Fetching clothing, accessories, and health & pharmacy entities...');
    
    if (!db) {
      return res.status(500).json({
        error: 'Database not available',
        message: 'Database connection failed'
      });
    }

    const entities = await db
      .select({
        id: shoppingEntities.id,
        name: shoppingEntities.name,
        subcategory: shoppingSubcategories.name
      })
      .from(shoppingEntities)
      .innerJoin(shoppingSubcategories, eq(shoppingEntities.subcategoryId, shoppingSubcategories.id))
      .where(sql`${shoppingEntities.subcategoryId} IN (3, 4, 5)`) // Clothing (3), Accessories (4), Health & Pharmacy (5)
      .orderBy(shoppingEntities.name);

    res.json({
      success: true,
      data: entities,
      count: entities.length,
      subcategories: ['Clothing', 'Accessories', 'Health & Pharmacy']
    });
  } catch (error) {
    console.error('Error fetching clothing, accessories, and health & pharmacy:', error);
    res.status(500).json({
      error: 'Failed to fetch clothing, accessories, and health & pharmacy',
      message: error.message
    });
  }
});

export default router;
