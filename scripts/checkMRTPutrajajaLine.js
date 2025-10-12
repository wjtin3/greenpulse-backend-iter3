import { pool } from '../config/database.js';

async function checkMRTPutrajajaLine() {
    console.log('Checking MRT Putrajaya Line (PYL) stops...\n');
    
    // Get all stops on the MRT Putrajaya Line
    const query = `
        SELECT DISTINCT 
            s.stop_id,
            s.stop_name,
            s.stop_code,
            s.stop_lat,
            s.stop_lon,
            MIN(st.stop_sequence) as min_seq
        FROM gtfs.stops_rapid_rail_kl s
        JOIN gtfs.stop_times_rapid_rail_kl st ON s.stop_id = st.stop_id
        JOIN gtfs.trips_rapid_rail_kl t ON st.trip_id = t.trip_id
        JOIN gtfs.routes_rapid_rail_kl r ON t.route_id = r.route_id
        WHERE r.route_id = 'PYL'
        GROUP BY s.stop_id, s.stop_name, s.stop_code, s.stop_lat, s.stop_lon
        ORDER BY min_seq
    `;
    
    const result = await pool.query(query);
    
    console.log(`Found ${result.rows.length} stops on MRT Putrajaya Line:`);
    result.rows.forEach((stop, idx) => {
        console.log(`  ${idx + 1}. ${stop.stop_name} (${stop.stop_id})`);
    });
    
    // Check if KL Sentral or KLCC is on this line
    console.log('\nChecking for KL Sentral or KLCC connections...');
    const klStops = result.rows.filter(stop => 
        stop.stop_name.includes('SENTRAL') || 
        stop.stop_name.includes('KLCC') ||
        stop.stop_name.includes('BUKIT BINTANG') ||
        stop.stop_name.includes('PASAR SENI') ||
        stop.stop_name.includes('MALURI')
    );
    
    if (klStops.length > 0) {
        console.log(`✅ Found ${klStops.length} KL area stops:`);
        klStops.forEach(stop => {
            console.log(`  - ${stop.stop_name} (${stop.stop_id})`);
        });
    } else {
        console.log(`⚠️  No direct KL Sentral/KLCC stops found on this line`);
        console.log(`   (This line might require transfers)`);
    }
    
    await pool.end();
}

checkMRTPutrajajaLine();


