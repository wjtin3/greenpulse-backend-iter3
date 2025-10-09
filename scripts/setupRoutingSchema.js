import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup script for Routing Service database schema
 * Creates tables for storing route comparison history
 */

async function setupRoutingSchema() {
    const client = await pool.connect();
    
    try {
        console.log('=== Setting up Routing Service schema ===\n');
        
        // Read the schema file
        const schemaPath = path.join(__dirname, '..', 'db', 'routing_schema.sql');
        console.log(`Reading schema from: ${schemaPath}`);
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Executing schema...');
        await client.query(schema);
        
        console.log('\n[SUCCESS] Routing Service schema created successfully!\n');
        
        // Verify tables were created
        console.log('Verifying tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'route_comparisons'
            ORDER BY table_name
        `);
        
        console.log(`\nCreated ${tablesResult.rows.length} table(s):`);
        tablesResult.rows.forEach(row => {
            console.log(`  - public.${row.table_name}`);
        });
        
        // Verify functions were created
        const functionsResult = await client.query(`
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_type = 'FUNCTION'
            AND (routine_name LIKE '%route%' OR routine_name LIKE '%comparison%')
            ORDER BY routine_name
        `);
        
        console.log(`\nCreated ${functionsResult.rows.length} function(s):`);
        functionsResult.rows.forEach(row => {
            console.log(`  - public.${row.routine_name}()`);
        });
        
        // Verify view was created
        const viewsResult = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%route%'
            ORDER BY table_name
        `);
        
        console.log(`\nCreated ${viewsResult.rows.length} view(s):`);
        viewsResult.rows.forEach(row => {
            console.log(`  - public.${row.table_name}`);
        });
        
        console.log('\n=== Setup complete! ===\n');
        console.log('Next steps:');
        console.log('1. Test the API endpoints:');
        console.log('   POST /api/routing/compare');
        console.log('2. Check the health endpoint:');
        console.log('   GET /api/routing/health');
        console.log('3. Try a quick comparison:');
        console.log('   POST /api/routing/compare/quick\n');
        
    } catch (error) {
        console.error('\n[ERROR] Error setting up Routing Service schema:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the setup
setupRoutingSchema()
    .then(() => {
        console.log('Schema setup completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Schema setup failed:', error);
        process.exit(1);
    });

