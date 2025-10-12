import { pool } from '../config/database.js';

/**
 * Drop and recreate GTFS Realtime tables
 * WARNING: This will delete all existing vehicle position data!
 */
async function resetRealtimeTables() {
    const client = await pool.connect();
    
    try {
        console.log('⚠️  WARNING: This will delete all vehicle position data!\n');
        
        const categories = ['rapid_bus_kl', 'rapid_bus_mrtfeeder', 'rapid_rail_kl', 'ktmb'];
        
        console.log('🗑️  Dropping old tables and functions...\n');
        
        // Drop view first (depends on tables)
        console.log('   Dropping view: all_vehicle_positions_current');
        await client.query('DROP VIEW IF EXISTS gtfs.all_vehicle_positions_current CASCADE');
        
        // Drop functions
        console.log('   Dropping functions...');
        await client.query('DROP FUNCTION IF EXISTS gtfs.get_latest_vehicle_positions CASCADE');
        await client.query('DROP FUNCTION IF EXISTS gtfs.get_vehicle_positions_within_radius CASCADE');
        await client.query('DROP FUNCTION IF EXISTS gtfs.get_vehicle_history CASCADE');
        await client.query('DROP FUNCTION IF EXISTS gtfs.cleanup_old_vehicle_positions CASCADE');
        await client.query('DROP FUNCTION IF EXISTS gtfs.create_realtime_vehicle_positions_table CASCADE');
        
        // Drop tables for each category
        for (const category of categories) {
            console.log(`   Dropping table: vehicle_positions_${category}`);
            await client.query(`DROP TABLE IF EXISTS gtfs.vehicle_positions_${category} CASCADE`);
        }
        
        console.log('\n✅ Old tables and functions dropped\n');
        console.log('💡 Now run: node scripts/setupRealtimeSchema.js\n');
        
    } catch (error) {
        console.error('\n❌ Error resetting tables:', error.message);
        console.error('   Details:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the reset
resetRealtimeTables();

