import { routeCacheService } from '../services/routeCacheService.js';
import { popularRoutes } from '../config/popularRoutes.js';

async function cachePopularRoutes() {
    console.log('🚀 Pre-caching popular routes...\n');
    console.log(`📋 Total routes to cache: ${popularRoutes.length}\n`);

    const startTime = Date.now();
    
    try {
        const cached = await routeCacheService.preCachePopularRoutes(popularRoutes);
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n✅ Caching complete!`);
        console.log(`   • Cached: ${cached} routes`);
        console.log(`   • Time: ${elapsed}s`);
        console.log(`   • Average: ${(elapsed / cached).toFixed(2)}s per route`);
        
        // Show stats
        const stats = await routeCacheService.getStats();
        if (stats) {
            console.log(`\n📊 Cache Statistics:`);
            stats.byMode.forEach(row => {
                console.log(`   • ${row.mode}: ${row.total_routes} routes, ${row.total_hits} total hits`);
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error caching routes:', error);
        process.exit(1);
    }
}

cachePopularRoutes();

