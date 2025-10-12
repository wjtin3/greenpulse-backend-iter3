import { popularTransitRoutes } from '../config/popularTransitRoutes.js';
import TransitRoutingService from '../services/transitRoutingService.js';
import { pool } from '../config/database.js';

/**
 * Pre-cache popular transit routes in Klang Valley
 * This significantly speeds up routing for common journeys
 */

async function cachePopularTransitRoutes() {
    console.log('🚇 Starting transit route pre-caching...');
    console.log(`📊 Total routes to cache: ${popularTransitRoutes.length}`);
    console.log('');
    
    const transitService = new TransitRoutingService();
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    const startTime = Date.now();
    
    for (let i = 0; i < popularTransitRoutes.length; i++) {
        const route = popularTransitRoutes[i];
        const progress = `[${i + 1}/${popularTransitRoutes.length}]`;
        
        try {
            console.log(`${progress} 🔄 ${route.name}`);
            console.log(`   Origin: ${route.origin.name} (${route.origin.lat}, ${route.origin.lon})`);
            console.log(`   Destination: ${route.destination.name} (${route.destination.lat}, ${route.destination.lon})`);
            
            const result = await transitService.planTransitRoute(
                route.origin.lat,
                route.origin.lon,
                route.destination.lat,
                route.destination.lon
            );
            
            if (result.success) {
                successCount++;
                console.log(`   ✅ Success: ${result.totalRoutes || 0} routes found (${result.routeTypes?.direct || 0} direct, ${result.routeTypes?.transfer || 0} transfer)`);
            } else {
                if (result.error && result.error.includes('No public transport routes found')) {
                    skippedCount++;
                    console.log(`   ⚠️  Skipped: No routes available between these locations`);
                } else {
                    errorCount++;
                    errors.push({ route: route.name, error: result.error });
                    console.log(`   ❌ Error: ${result.error}`);
                }
            }
            
            console.log('');
            
            // Add a small delay to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            errorCount++;
            errors.push({ route: route.name, error: error.message });
            console.log(`   ❌ Exception: ${error.message}`);
            console.log('');
        }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('═'.repeat(70));
    console.log('📊 PRE-CACHING SUMMARY');
    console.log('═'.repeat(70));
    console.log(`✅ Successfully cached: ${successCount} routes`);
    console.log(`⚠️  Skipped (no routes): ${skippedCount} routes`);
    console.log(`❌ Errors: ${errorCount} routes`);
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`⚡ Average time per route: ${(duration / popularTransitRoutes.length).toFixed(2)}s`);
    console.log('═'.repeat(70));
    
    // Print errors if any
    if (errors.length > 0) {
        console.log('');
        console.log('❌ ERROR DETAILS:');
        console.log('─'.repeat(70));
        errors.forEach((err, idx) => {
            console.log(`${idx + 1}. ${err.route}`);
            console.log(`   Error: ${err.error}`);
        });
        console.log('─'.repeat(70));
    }
    
    // Check cache statistics
    try {
        const client = await pool.connect();
        const cacheStats = await client.query(`
            SELECT mode, COUNT(*) as count
            FROM route_cache
            GROUP BY mode
        `);
        
        console.log('');
        console.log('💾 CACHE STATISTICS:');
        console.log('─'.repeat(70));
        cacheStats.rows.forEach(row => {
            console.log(`${row.mode.padEnd(10)} : ${row.count} cached routes`);
        });
        console.log('─'.repeat(70));
        
        client.release();
    } catch (error) {
        console.error('Error fetching cache statistics:', error.message);
    }
    
    console.log('');
    console.log('✅ Transit route pre-caching complete!');
    process.exit(0);
}

// Run the caching
cachePopularTransitRoutes().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

