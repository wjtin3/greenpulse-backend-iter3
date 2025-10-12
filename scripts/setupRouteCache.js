import { pool } from '../config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupRouteCache() {
    console.log('🚀 Setting up route cache system...\n');

    try {
        // Read and execute schema
        const schemaPath = join(__dirname, '..', 'db', 'route_cache_schema.sql');
        const schema = readFileSync(schemaPath, 'utf8');
        
        console.log('📋 Creating route_cache table and indexes...');
        await pool.query(schema);
        console.log('✅ Route cache table created successfully\n');

        // Check if table exists and show structure
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'route_cache'
            ORDER BY ordinal_position
        `);
        
        console.log('📊 Table structure:');
        tableInfo.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
        });
        
        console.log('\n✅ Route cache system ready!');
        console.log('\n📚 Next steps:');
        console.log('   1. Run: npm run cache-popular-routes (to pre-cache common routes)');
        console.log('   2. The system will automatically cache new routes as they\'re requested');
        console.log('   3. Check stats: GET /api/cache/stats');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up route cache:', error);
        process.exit(1);
    }
}

setupRouteCache();

