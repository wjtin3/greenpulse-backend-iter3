import { pool } from '../config/database.js';

async function checkTransitCache() {
    try {
        console.log('📊 Checking transit route cache status...\n');
        
        // Check transit routes count
        const transitCount = await pool.query(`
            SELECT COUNT(*) as count 
            FROM route_cache 
            WHERE mode = 'transit'
        `);
        
        console.log(`✓ Total transit routes cached: ${transitCount.rows[0].count}`);
        
        // Check cache age
        const cacheAge = await pool.query(`
            SELECT 
                MIN(created_at) as oldest,
                MAX(created_at) as newest,
                COUNT(*) as count
            FROM route_cache 
            WHERE mode = 'transit'
        `);
        
        if (cacheAge.rows[0].count > 0) {
            const oldest = new Date(cacheAge.rows[0].oldest);
            const newest = new Date(cacheAge.rows[0].newest);
            const oldestAge = Math.floor((Date.now() - oldest) / 1000 / 60 / 60);
            const newestAge = Math.floor((Date.now() - newest) / 1000 / 60 / 60);
            
            console.log(`✓ Oldest cache entry: ${oldestAge}h ago`);
            console.log(`✓ Newest cache entry: ${newestAge}h ago`);
        }
        
        // Check sample routes
        const samples = await pool.query(`
            SELECT origin_lat, origin_lon, dest_lat, dest_lon, distance, duration, created_at
            FROM route_cache 
            WHERE mode = 'transit'
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        if (samples.rows.length > 0) {
            console.log('\n📋 Sample cached routes:');
            samples.rows.forEach((row, idx) => {
                const age = Math.floor((Date.now() - new Date(row.created_at)) / 1000 / 60);
                const distance = parseFloat(row.distance);
                const duration = parseFloat(row.duration);
                console.log(`  ${idx + 1}. [${row.origin_lat},${row.origin_lon}] → [${row.dest_lat},${row.dest_lon}]`);
                console.log(`     ${distance.toFixed(1)}km, ${duration.toFixed(0)}min, ${age}min old`);
            });
        }
        
        // Recommendation
        console.log('\n💡 Recommendation:');
        const count = parseInt(transitCount.rows[0].count);
        if (count === 0) {
            console.log('   ⚠️  No transit routes cached - SHOULD RUN CACHING');
        } else if (count < 30) {
            console.log(`   ⚠️  Only ${count} routes cached - SHOULD RUN CACHING (target: 50+)`);
        } else if (cacheAge.rows[0].count > 0 && oldestAge > 24) {
            console.log(`   ⚠️  Cache is ${oldestAge}h old - CONSIDER RE-CACHING`);
        } else {
            console.log(`   ✅ Cache looks good (${count} routes, <24h old)`);
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error checking cache:', error.message);
        process.exit(1);
    }
}

checkTransitCache();

