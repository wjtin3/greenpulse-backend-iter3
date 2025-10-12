import { pool } from '../config/database.js';

async function getActualStopIds() {
    console.log('Getting actual stop IDs from database...\n');
    
    // MRT feeder stops near Cyberjaya
    const cyberjajaFeeder = await pool.query(`
        SELECT stop_id, stop_name, stop_code, stop_lat, stop_lon
        FROM gtfs.stops_rapid_bus_mrtfeeder
        WHERE stop_name LIKE '%PRIMERA%' OR stop_name LIKE '%JPJ BAH%' OR stop_name LIKE '%QUILL%'
        LIMIT 5
    `);
    
    console.log('Cyberjaya MRT Feeder stops:');
    cyberjajaFeeder.rows.forEach(stop => {
        console.log(`  ${stop.stop_id}: ${stop.stop_name} (${stop.stop_code})`);
    });
    
    // Putrajaya bus stops
    const putrajajabus = await pool.query(`
        SELECT stop_id, stop_name, stop_code, stop_lat, stop_lon
        FROM gtfs.stops_rapid_bus_kl
        WHERE stop_name LIKE '%PUTRAJAYA PRESINT 18%' OR stop_name LIKE '%WARISAN%'
        LIMIT 5
    `);
    
    console.log('\nPutrajaya Bus stops:');
    putrajajabus.rows.forEach(stop => {
        console.log(`  ${stop.stop_id}: ${stop.stop_name} (${stop.stop_code})`);
    });
    
    // Putrajaya rail stops
    const rail = await pool.query(`
        SELECT stop_id, stop_name, stop_code, stop_lat, stop_lon
        FROM gtfs.stops_rapid_rail_kl
        WHERE stop_name LIKE '%PUTRAJAYA%' OR stop_name LIKE '%CYBERJAYA%'
        LIMIT 10
    `);
    
    console.log('\nRail stops (Putrajaya/Cyberjaya):');
    rail.rows.forEach(stop => {
        console.log(`  ${stop.stop_id}: ${stop.stop_name} (${stop.stop_code})`);
    });
    
    await pool.end();
}

getActualStopIds();


