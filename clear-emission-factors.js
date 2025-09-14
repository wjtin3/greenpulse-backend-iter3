import { pool } from './config/database.js';

async function clearEmissionFactors() {
    try {
        console.log('🗑️ Clearing carbon_emission_factors table...');
        
        const result = await pool.query('DELETE FROM carbon_emission_factors');
        
        console.log(`✅ Cleared ${result.rowCount} rows from carbon_emission_factors table`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

clearEmissionFactors();
