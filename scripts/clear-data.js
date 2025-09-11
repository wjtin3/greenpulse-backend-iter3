import { pool } from '../config/database.js';

const clearAllData = async () => {
  try {
    const client = await pool.connect();
    
    console.log('🧹 Clearing existing data...');
    
    // Clear tables in reverse dependency order (child tables first)
    const tables = [
      'household_factors',
      'household_factor_category', 
      'region',
      'public_transport',
      'vehicle_emission_factor',
      'vehicle_size',
      'fuel_type',
      'vehicle_category',
      'shopping_emission_factors',
      'shopping_entities',
      'shopping_subcategories',
      'shopping_categories',
      'food_emission_factors',
      'food_entities',
      'food_subcategories',
      'food_categories'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`DELETE FROM ${table}`);
        console.log(`✅ Cleared ${table}`);
      } catch (error) {
        console.warn(`⚠️  Could not clear ${table}: ${error.message}`);
      }
    }
    
    // Reset auto-increment sequences
    for (const table of tables) {
      try {
        await client.query(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`);
        console.log(`✅ Reset sequence for ${table}`);
      } catch (error) {
        console.warn(`⚠️  Could not reset sequence for ${table}: ${error.message}`);
      }
    }
    
    client.release();
    console.log('🎉 Data clearing completed!');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    throw error;
  }
};

// Run clear
clearAllData()
  .then(() => {
    console.log('✅ All data cleared successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Data clearing failed:', error);
    process.exit(1);
  });
