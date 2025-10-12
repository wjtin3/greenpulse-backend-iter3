import { pool } from '../config/database.js';

async function checkRoutesFromStops() {
    const testCases = [
        {
            stopName: 'PRIMERA SUITE (Cyberjaya MRT feeder)',
            stopId: '12002325',
            category: 'rapid_bus_mrtfeeder'
        },
        {
            stopName: 'PUTRAJAYA SENTRAL (Cyberjaya rail)',
            stopId: 'PY41',
            category: 'rapid_rail_kl'
        },
        {
            stopName: 'CYBERJAYA CITY CENTRE (Cyberjaya rail)',
            stopId: 'PY40',
            category: 'rapid_rail_kl'
        },
        {
            stopName: 'PPJ183 SK PUTRAJAYA (Putrajaya bus)',
            stopId: '1005613',
            category: 'rapid_bus_kl'
        },
        {
            stopName: 'PUTRAJAYA SENTRAL (Putrajaya rail)',
            stopId: 'PY41',
            category: 'rapid_rail_kl'
        }
    ];
    
    for (const test of testCases) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`Checking routes from: ${test.stopName}`);
        console.log(`Stop ID: ${test.stopId}, Category: ${test.category}`);
        console.log(`${'='.repeat(70)}`);
        
        const categoryTable = test.category.replace(/-/g, '_');
        
        // Check if stop exists
        const stopCheck = await pool.query(
            `SELECT stop_id, stop_name FROM gtfs.stops_${categoryTable} WHERE stop_id = $1`,
            [test.stopId]
        );
        
        if (stopCheck.rows.length === 0) {
            console.log(`❌ Stop not found in ${test.category} table`);
            continue;
        }
        
        console.log(`✅ Stop found: ${stopCheck.rows[0].stop_name}`);
        
        // Check routes from this stop
        const routesQuery = `
            SELECT DISTINCT 
                r.route_id,
                r.route_short_name,
                r.route_long_name,
                COUNT(DISTINCT st.trip_id) as trip_count
            FROM gtfs.routes_${categoryTable} r
            JOIN gtfs.trips_${categoryTable} t ON r.route_id = t.route_id
            JOIN gtfs.stop_times_${categoryTable} st ON t.trip_id = st.trip_id
            WHERE st.stop_id = $1
            GROUP BY r.route_id, r.route_short_name, r.route_long_name
            LIMIT 10
        `;
        
        try {
            const routes = await pool.query(routesQuery, [test.stopId]);
            
            if (routes.rows.length > 0) {
                console.log(`\nFound ${routes.rows.length} routes from this stop:`);
                routes.rows.forEach((route, idx) => {
                    console.log(`  ${idx + 1}. ${route.route_short_name || route.route_id}: ${route.route_long_name || 'N/A'}`);
                    console.log(`     (${route.trip_count} trips)`);
                });
            } else {
                console.log(`\n⚠️ No routes found from this stop`);
            }
        } catch (error) {
            console.log(`\n❌ Error checking routes: ${error.message}`);
        }
    }
    
    await pool.end();
}

checkRoutesFromStops();

