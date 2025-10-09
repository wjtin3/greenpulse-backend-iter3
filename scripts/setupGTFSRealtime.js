import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup script for GTFS Realtime database schema
 * Creates tables for storing vehicle position data
 */

async function setupGTFSRealtimeSchema() {
    const client = await pool.connect();
    
    try {
        console.log('=== Setting up GTFS Realtime schema ===\n');
        
        // Read the schema file
        const schemaPath = path.join(__dirname, '..', 'db', 'gtfs_realtime_schema.sql');
        console.log(`Reading schema from: ${schemaPath}`);
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Executing schema...');
        await client.query(schema);
        
        console.log('\n[SUCCESS] GTFS Realtime schema created successfully!\n');
        
        // Verify tables were created
        console.log('Verifying tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'gtfs' 
            AND table_name LIKE 'vehicle_positions_%'
            ORDER BY table_name
        `);
        
        console.log(`\nCreated ${tablesResult.rows.length} vehicle position tables:`);
        tablesResult.rows.forEach(row => {
            console.log(`  - gtfs.${row.table_name}`);
        });
        
        // Verify functions were created
        const functionsResult = await client.query(`
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'gtfs' 
            AND routine_type = 'FUNCTION'
            AND routine_name LIKE '%vehicle%'
            ORDER BY routine_name
        `);
        
        console.log(`\nCreated ${functionsResult.rows.length} functions:`);
        functionsResult.rows.forEach(row => {
            console.log(`  - gtfs.${row.routine_name}()`);
        });
        
        // Verify view was created
        const viewsResult = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'gtfs' 
            AND table_name LIKE '%vehicle%'
            ORDER BY table_name
        `);
        
        console.log(`\nCreated ${viewsResult.rows.length} views:`);
        viewsResult.rows.forEach(row => {
            console.log(`  - gtfs.${row.table_name}`);
        });
        
        console.log('\n=== Setup complete! ===\n');
        console.log('Next steps:');
        console.log('1. Test the API endpoints:');
        console.log('   POST /api/gtfs/realtime/refresh/all');
        console.log('2. Check the health endpoint:');
        console.log('   GET /api/gtfs/realtime/health');
        console.log('3. View vehicle positions:');
        console.log('   GET /api/gtfs/realtime/vehicles\n');
        
    } catch (error) {
        console.error('\n[ERROR] Error setting up GTFS Realtime schema:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the setup
setupGTFSRealtimeSchema()
    .then(() => {
        console.log('Schema setup completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Schema setup failed:', error);
        process.exit(1);
    });

