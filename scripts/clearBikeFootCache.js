#!/usr/bin/env node

/**
 * Clear only bike and foot route cache (after duration calculation fix)
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function clearBikeFootCache() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔌 Connected to database');
        console.log('🗑️  Clearing bike and foot route cache...\n');

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
        const beforeCount = await client.query(`
            SELECT mode, COUNT(*) as count 
            FROM route_cache 
            WHERE mode IN ('bike', 'foot')
            GROUP BY mode
            ORDER BY mode
        `);
        
        console.log('📊 Routes to delete:');
        if (beforeCount.rows.length === 0) {
            console.log('   No bike or foot routes found in cache');
        } else {
            beforeCount.rows.forEach(row => {
                console.log(`   - ${row.mode}: ${row.count} routes`);
            });
        }
        console.log('');

        // Delete bike and foot routes
        console.log('🗑️  Deleting bike and foot cached routes...');
        const deleteResult = await client.query(`
            DELETE FROM route_cache 
            WHERE mode IN ('bike', 'foot')
        `);
        console.log(`✅ Deleted ${deleteResult.rowCount} routes`);
        console.log('');

        // Show remaining cache
        const afterCount = await client.query(`
            SELECT mode, COUNT(*) as count 
            FROM route_cache 
            GROUP BY mode
            ORDER BY mode
        `);
        
        console.log('📊 Remaining cache:');
        if (afterCount.rows.length === 0) {
            console.log('   Cache is empty');
        } else {
            afterCount.rows.forEach(row => {
                console.log(`   - ${row.mode}: ${row.count} routes`);
            });
        }
        
        console.log('');
        console.log('✅ Bike and foot cache cleared!');
        console.log('💡 Next bike/foot route requests will use corrected duration calculations');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

clearBikeFootCache()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    });

