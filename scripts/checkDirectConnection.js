import { pool } from '../config/database.js';

async function checkDirectConnection() {
    console.log('Checking if PY41 (Putrajaya Sentral) connects to PY21 (Persiaran KLCC) on same route...\n');
    
    const query = `
        SELECT DISTINCT 
            t.trip_id, 
            t.route_id,
            r.route_short_name,
            r.route_long_name,
            st1.stop_sequence as py41_seq,
            st2.stop_sequence as py21_seq
        FROM gtfs.stop_times_rapid_rail_kl st1
        JOIN gtfs.trips_rapid_rail_kl t ON st1.trip_id = t.trip_id
        JOIN gtfs.stop_times_rapid_rail_kl st2 ON t.trip_id = st2.trip_id
        JOIN gtfs.routes_rapid_rail_kl r ON t.route_id = r.route_id
        WHERE st1.stop_id = 'PY41' 
          AND st2.stop_id = 'PY21'
          AND st1.stop_sequence < st2.stop_sequence
        LIMIT 5
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
        console.log(`✅ Found ${result.rows.length} trips connecting these stops:`);
        result.rows.forEach(trip => {
            console.log(`  - Trip ${trip.trip_id} on route ${trip.route_short_name || trip.route_id}`);
            console.log(`    ${trip.route_long_name || 'N/A'}`);
            console.log(`    Stop sequence: ${trip.py41_seq} → ${trip.py21_seq}`);
        });
    } else {
        console.log('❌ No direct trips found connecting these stops on the same route');
        
        // Check if they exist on ANY route
        console.log('\nChecking routes serving each stop separately...');
        
        const py41Routes = await pool.query(`
            SELECT DISTINCT r.route_id, r.route_short_name
            FROM gtfs.stop_times_rapid_rail_kl st
            JOIN gtfs.trips_rapid_rail_kl t ON st.trip_id = t.trip_id
            JOIN gtfs.routes_rapid_rail_kl r ON t.route_id = r.route_id
            WHERE st.stop_id = 'PY41'
        `);
        
        const py21Routes = await pool.query(`
            SELECT DISTINCT r.route_id, r.route_short_name
            FROM gtfs.stop_times_rapid_rail_kl st
            JOIN gtfs.trips_rapid_rail_kl t ON st.trip_id = t.trip_id
            JOIN gtfs.routes_rapid_rail_kl r ON t.route_id = r.route_id
            WHERE st.stop_id = 'PY21'
        `);
        
        console.log(`\nPY41 (Putrajaya Sentral) routes:`);
        py41Routes.rows.forEach(r => console.log(`  - ${r.route_short_name || r.route_id}`));
        
        console.log(`\nPY21 (Persiaran KLCC) routes:`);
        py21Routes.rows.forEach(r => console.log(`  - ${r.route_short_name || r.route_id}`));
    }
    
    await pool.end();
}

checkDirectConnection();


