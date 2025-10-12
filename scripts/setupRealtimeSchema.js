import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup GTFS Realtime schema in Neon database
 * This creates tables, functions, and views for vehicle position tracking
 */
async function setupRealtimeSchema() {
    const client = await pool.connect();
    
    try {
        console.log('📋 Setting up GTFS Realtime schema...\n');
        
        // Read the SQL schema file
        const schemaPath = path.join(__dirname, '..', 'db', 'gtfs_realtime_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('✅ Loaded schema file');
        console.log(`📄 Schema size: ${(schemaSql.length / 1024).toFixed(1)} KB\n`);
        
        // Execute the schema
        console.log('⚙️  Executing schema SQL...');
        await client.query(schemaSql);
        
        console.log('\n✅ Schema setup complete!\n');
        
        // Verify tables were created
        console.log('🔍 Verifying tables...');
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'gtfs' 
            AND table_name LIKE 'vehicle_positions_%'
            ORDER BY table_name
        `);
        
        console.log(`\n📊 Created ${tableCheck.rows.length} vehicle position tables:`);
        tableCheck.rows.forEach(row => {
            console.log(`   ✓ gtfs.${row.table_name}`);
        });
        
        // Verify functions were created
        console.log('\n🔍 Verifying functions...');
        const functionCheck = await client.query(`
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'gtfs' 
            AND routine_name LIKE '%vehicle%'
            ORDER BY routine_name
        `);
        
        console.log(`\n⚙️  Created ${functionCheck.rows.length} functions:`);
        functionCheck.rows.forEach(row => {
            console.log(`   ✓ gtfs.${row.routine_name}()`);
        });
        
        // Verify view was created
        console.log('\n🔍 Verifying views...');
        const viewCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'gtfs' 
            AND table_name LIKE '%vehicle%'
            ORDER BY table_name
        `);
        
        console.log(`\n👁️  Created ${viewCheck.rows.length} views:`);
        viewCheck.rows.forEach(row => {
            console.log(`   ✓ gtfs.${row.table_name}`);
        });
        
        console.log('\n🎉 GTFS Realtime schema is ready!');
        console.log('💡 You can now start tracking vehicle positions.\n');
        
    } catch (error) {
        console.error('\n❌ Error setting up schema:', error.message);
        console.error('   Details:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the setup
setupRealtimeSchema();

