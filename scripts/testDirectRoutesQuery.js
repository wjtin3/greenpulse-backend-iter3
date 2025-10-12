import { pool } from '../config/database.js';

async function testDirectRoutesQuery() {
    const originStopId = 'PY41';  // Putrajaya Sentral
    const destStopId = 'PY21';     // Persiaran KLCC
    const category = 'rapid_rail_kl';
    
    console.log(`Testing findDirectRoutes query:`);
    console.log(`Origin: ${originStopId}, Dest: ${destStopId}, Category: ${category}\n`);
    
    const query = `
        SELECT DISTINCT
            r.route_id,
            r.route_short_name,
            r.route_long_name,
            r.route_type,
            t.trip_id,
            t.trip_headsign,
            st1.stop_sequence as origin_sequence,
            st2.stop_sequence as dest_sequence,
            st1.departure_time as origin_departure,
            st2.arrival_time as dest_arrival
        FROM gtfs.routes_${category} r
        JOIN gtfs.trips_${category} t ON r.route_id = t.route_id
        JOIN gtfs.stop_times_${category} st1 ON t.trip_id = st1.trip_id
        JOIN gtfs.stop_times_${category} st2 ON t.trip_id = st2.trip_id
        WHERE st1.stop_id = $1
        AND st2.stop_id = $2
        AND st1.stop_sequence < st2.stop_sequence
        ORDER BY r.route_short_name
        LIMIT 5
    `;
    
    console.log('Executing query...');
    
    try {
        const result = await pool.query(query, [originStopId, destStopId]);
        
        if (result.rows.length > 0) {
            console.log(`\n✅ Found ${result.rows.length} direct routes:`);
            result.rows.forEach((route, idx) => {
                console.log(`\n${idx + 1}. Route: ${route.route_short_name || route.route_id}`);
                console.log(`   ${route.route_long_name || 'N/A'}`);
                console.log(`   Trip: ${route.trip_id}`);
                console.log(`   Sequence: ${route.origin_sequence} → ${route.dest_sequence}`);
            });
        } else {
            console.log('\n❌ No direct routes found');
        }
    } catch (error) {
        console.log(`\n❌ Query error: ${error.message}`);
        console.log(error.stack);
    }
    
    await pool.end();
}

testDirectRoutesQuery();


