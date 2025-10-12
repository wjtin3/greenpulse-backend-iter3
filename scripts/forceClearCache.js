#!/usr/bin/env node

/**
 * Force clear ALL route cache with detailed logging
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function forceClearCache() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔌 Connected to database');
        console.log('🗑️  Force clearing ALL route cache...\n');

        // Check if table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'route_cache'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('⚠️  route_cache table does not exist!');
            return;
        }

        // Get count before deletion
        const beforeCount = await client.query(`SELECT COUNT(*) as count FROM route_cache`);
        console.log(`📊 Routes in cache before: ${beforeCount.rows[0].count}`);

        if (beforeCount.rows[0].count > 0) {
            // Get breakdown by mode
            const breakdown = await client.query(`
                SELECT mode, COUNT(*) as count 
                FROM route_cache 
                GROUP BY mode
                ORDER BY mode
            `);
            
            console.log('   Breakdown by mode:');
            breakdown.rows.forEach(row => {
                console.log(`   - ${row.mode}: ${row.count} routes`);
            });
        }
        console.log('');

        // Delete ALL routes
        console.log('🗑️  Deleting all cached routes...');
        const deleteResult = await client.query(`DELETE FROM route_cache`);
        console.log(`✅ Deleted ${deleteResult.rowCount} routes`);
        console.log('');

        // Verify deletion
        const afterCount = await client.query(`SELECT COUNT(*) as count FROM route_cache`);
        console.log(`✅ Verified: ${afterCount.rows[0].count} routes remaining`);
        
        if (afterCount.rows[0].count === 0) {
            console.log('✅ Cache is now completely empty!');
        } else {
            console.log('⚠️  Warning: Some routes still remain!');
        }
        
        console.log('');
        console.log('💡 Next route calculation will be fresh!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

forceClearCache()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    });

