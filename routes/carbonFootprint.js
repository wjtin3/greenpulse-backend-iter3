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

// Calculate travel carbon footprint
router.post('/calculate/travel', async (req, res) => {
  try {
    const { privateTransport, publicTransport } = req.body;

    if (!privateTransport && !publicTransport) {
      return res.status(400).json({ 
        error: 'At least one transport type (privateTransport or publicTransport) is required' 
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
    const vehicleFactors = await db.select().from(vehicleEmissionFactor);
    const categoryFactors = await db.select().from(vehicleCategory);
    const sizeFactors = await db.select().from(vehicleSize);
    const fuelFactors = await db.select().from(fuelType);
    const publicTransportFactors = await db.select().from(publicTransport);

    let totalEmissions = 0;
    const results = {
      privateTransport: { total: 0, breakdown: [] },
      publicTransport: { total: 0, breakdown: [] }
    };

    // Calculate private transport emissions
    if (privateTransport && privateTransport.length > 0) {
      results.privateTransport = calculatePrivateTransportEmissions(
        privateTransport, 
        vehicleFactors, 
        categoryFactors, 
        sizeFactors, 
        fuelFactors
      );
      totalEmissions += results.privateTransport.total;
    }

    // Calculate public transport emissions
    if (publicTransport && publicTransport.length > 0) {
      results.publicTransport = calculatePublicTransportEmissions(publicTransport, publicTransportFactors);
      totalEmissions += results.publicTransport.total;
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
      numberOfPeople, 
      electricityUsage, 
      waterUsage, 
      wasteDisposal 
    } = req.body;

    if (!numberOfPeople || !electricityUsage || !waterUsage || !wasteDisposal) {
      return res.status(400).json({ 
        error: 'All fields are required: numberOfPeople, electricityUsage, waterUsage, wasteDisposal' 
      });
    }

    // Get household emission factors
    const householdFactorsData = await db.select().from(householdFactors);

    const householdData = {
      numberOfPeople,
      electricityUsage,
      waterUsage,
      wasteDisposal
    };

    const results = calculateHouseholdEmissions(householdData, householdFactorsData);

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
    const { foodItems } = req.body;

    if (!foodItems || foodItems.length === 0) {
      return res.status(400).json({ 
        error: 'Food items data is required' 
      });
    }

    // Get food emission factors
    const foodFactors = await db.select().from(foodEmissionFactors);

    const results = calculateFoodEmissions(foodItems, foodFactors);

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
    const { shoppingItems } = req.body;

    if (!shoppingItems || shoppingItems.length === 0) {
      return res.status(400).json({ 
        error: 'Shopping items data is required' 
      });
    }

    // Get shopping emission factors
    const shoppingFactors = await db.select().from(shoppingEmissionFactors);

    const results = calculateShoppingEmissions(shoppingItems, shoppingFactors);

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

  for (const item of transportData) {
    const { vehicleType, vehicleSize, fuelType, distance } = item;
    
    // Find matching emission factor by looking up IDs
    const category = categoryFactors.find(c => c.categoryName === vehicleType);
    const size = sizeFactors.find(s => s.sizeName === vehicleSize);
    const fuel = fuelFactors.find(f => f.fuelName === fuelType);
    
    if (category && size && fuel) {
      // Find the emission factor using all three IDs
      const factor = vehicleFactors.find(f => 
        f.categoryId === category.id && 
        f.sizeId === size.id && 
        f.fuelId === fuel.id
      );

      if (factor) {
        const emissions = distance * parseFloat(factor.emissionValue);
        total += emissions;
        
        breakdown.push({
          vehicleType,
          vehicleSize,
          fuelType,
          distance,
          emissionFactor: factor.emissionValue,
          emissions: emissions
        });
      }
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
  const averageHouseholdFactor = factors.find(f => f.factorName === 'average_household');
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
  const electricityFactor = factors.find(f => f.factorName === 'electricity');
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
  const waterFactor = factors.find(f => f.factorName === 'water');
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
  const wasteFactor = factors.find(f => f.factorName === 'waste');
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
    const { foodType, quantity, unit } = item;
    
    const factor = factors.find(f => f.foodType === foodType && f.unit === unit);

    if (factor) {
      const emissions = quantity * factor.emissionFactor;
      total += emissions;
      
      breakdown.push({
        foodType,
        quantity,
        unit,
        emissionFactor: factor.emissionFactor,
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
    const { category, subcategory, quantity, unit } = item;
    
    const factor = factors.find(f => 
      f.category === category && f.subcategory === subcategory && f.unit === unit
    );

    if (factor) {
      const emissions = quantity * factor.emissionFactor;
      total += emissions;
      
      breakdown.push({
        category,
        subcategory,
        quantity,
        unit,
        emissionFactor: factor.emissionFactor,
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

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching food emission factors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch food emission factors',
      message: error.message 
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
