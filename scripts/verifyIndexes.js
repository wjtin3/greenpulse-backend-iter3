import { pool } from '../config/database.js';

async function verifyIndexes() {
    try {
        console.log('🔍 Checking GTFS indexes...\n');
        
        const result = await pool.query(`
            SELECT 
                schemaname,
                tablename,
                COUNT(*) as index_count
            FROM pg_indexes
            WHERE schemaname = 'gtfs'
            GROUP BY schemaname, tablename
            ORDER BY tablename
        `);
        
        console.log('📊 Indexes per table:');
        result.rows.forEach(row => {
            console.log(`   ${row.tablename}: ${row.index_count} indexes`);
        });
        
        const totalIndexes = result.rows.reduce((sum, row) => sum + parseInt(row.index_count), 0);
        console.log(`\n✅ Total indexes: ${totalIndexes}`);
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyIndexes();

