import TransitRoutingService from '../services/transitRoutingService.js';
import { pool } from '../config/database.js';

async function testDetailedRouting() {
    const transitService = new TransitRoutingService();
    
    console.log('=== Testing: Putrajaya to KLCC ===\n');
    
    const originLat = 2.9264;
    const originLon = 101.6964;
    const destLat = 3.1572757;
    const destLon = 101.7122335;
    
    // Step 1: Find nearby stops
    console.log('Step 1: Finding nearby stops at origin (Putrajaya)');
    const originStops = await transitService.findNearbyStops(originLat, originLon, 5.0, 20);
    console.log(`Found ${originStops.length} stops near origin:`);
    originStops.slice(0, 5).forEach(stop => {
        console.log(`  - ${stop.stop_name} (${stop.category}): ${stop.distance_km}km`);
    });
    
    console.log('\nStep 2: Finding nearby stops at destination (KLCC)');
    const destStops = await transitService.findNearbyStops(destLat, destLon, 5.0, 20);
    console.log(`Found ${destStops.length} stops near destination:`);
    destStops.slice(0, 5).forEach(stop => {
        console.log(`  - ${stop.stop_name} (${stop.category}): ${stop.distance_km}km`);
    });
    
    // Step 3: Check if any are on the same line
    console.log('\nStep 3: Checking for rail-to-rail connections');
    const originRail = originStops.filter(s => s.category === 'rapid-rail-kl');
    const destRail = destStops.filter(s => s.category === 'rapid-rail-kl');
    
    console.log(`Origin rail stops: ${originRail.length}`);
    originRail.forEach(stop => {
        console.log(`  - ${stop.stop_name} (${stop.stop_id})`);
    });
    
    console.log(`Destination rail stops: ${destRail.length}`);
    destRail.forEach(stop => {
        console.log(`  - ${stop.stop_name} (${stop.stop_id})`);
    });
    
    // Step 4: Test direct route finding
    if (originRail.length > 0 && destRail.length > 0) {
        console.log('\nStep 4: Testing direct route finding');
        const firstOriginRail = originRail[0];
        const firstDestRail = destRail[0];
        
        console.log(`Testing: ${firstOriginRail.stop_name} → ${firstDestRail.stop_name}`);
        console.log(`Categories: ${firstOriginRail.category} → ${firstDestRail.category}`);
        
        const connections = await transitService.findConnectingRoutes(
            firstOriginRail.stop_id,
            firstDestRail.stop_id,
            firstOriginRail.category,
            firstDestRail.category
        );
        
        console.log(`Direct routes found: ${connections.direct.length}`);
        console.log(`Transfer routes found: ${connections.transfers.length}`);
        
        if (connections.direct.length > 0) {
            console.log('\n✅ Direct routes:');
            connections.direct.forEach(route => {
                console.log(`  - ${route.route_short_name || route.route_id}: ${route.route_long_name}`);
            });
        }
    }
    
    await pool.end();
}

testDetailedRouting();


