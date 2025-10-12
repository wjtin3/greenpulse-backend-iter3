import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import unzipper from 'unzipper';
import csv from 'csv-parser';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KTMB_GTFS_URL = 'https://api.data.gov.my/gtfs-static/ktmb';
const TEMP_DIR = path.join(__dirname, '../temp');
const KTMB_ZIP = path.join(TEMP_DIR, 'ktmb.zip');
const KTMB_EXTRACT = path.join(TEMP_DIR, 'ktmb');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

console.log('🚂 KTMB GTFS Data Importer');
console.log('📊 Source: data.gov.my - Malaysia Open Data Portal\n');

/**
 * Download KTMB GTFS data
 */
async function downloadKTMBData() {
    console.log('📥 Downloading KTMB GTFS data...');
    console.log(`   URL: ${KTMB_GTFS_URL}`);
    
    try {
        const response = await fetch(KTMB_GTFS_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(KTMB_ZIP, Buffer.from(buffer));
        
        console.log(`✅ Downloaded ${(buffer.byteLength / 1024).toFixed(2)} KB`);
        return true;
    } catch (error) {
        console.error('❌ Download failed:', error.message);
        return false;
    }
}

/**
 * Extract GTFS ZIP file
 */
async function extractGTFSZip() {
    console.log('\n📦 Extracting GTFS files...');
    
    try {
        if (fs.existsSync(KTMB_EXTRACT)) {
            fs.rmSync(KTMB_EXTRACT, { recursive: true, force: true });
        }
        fs.mkdirSync(KTMB_EXTRACT, { recursive: true });
        
        await fs.createReadStream(KTMB_ZIP)
            .pipe(unzipper.Extract({ path: KTMB_EXTRACT }))
            .promise();
        
        const files = fs.readdirSync(KTMB_EXTRACT);
        console.log(`✅ Extracted ${files.length} files:`);
        files.forEach(file => console.log(`   - ${file}`));
        
        return true;
    } catch (error) {
        console.error('❌ Extraction failed:', error.message);
        return false;
    }
}

/**
 * Import CSV file into PostgreSQL
 */
async function importCSV(filename, tableName, requiredColumns = []) {
    const filePath = path.join(KTMB_EXTRACT, filename);
    
    if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  ${filename} not found, skipping...`);
        return 0;
    }
    
    console.log(`\n📄 Importing ${filename} → gtfs.${tableName}`);
    
    return new Promise((resolve, reject) => {
        const rows = [];
        let hasError = false;
        let skippedRows = 0;
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Validate required columns
                const missingColumns = requiredColumns.filter(col => !row[col]);
                if (missingColumns.length > 0) {
                    skippedRows++;
                    return;
                }
                
                // Add category for stops
                if (tableName === 'stops_ktmb') {
                    row.category = 'ktmb';
                }
                
                rows.push(row);
            })
            .on('error', (error) => {
                console.error(`   ❌ Error reading ${filename}:`, error.message);
                hasError = true;
            })
            .on('end', async () => {
                if (hasError || rows.length === 0) {
                    console.log(`   ⚠️  No valid data to import`);
                    resolve(0);
                    return;
                }
                
                try {
                    const client = await pool.connect();
                    
                    // Data already cleared in main function before importing
                    
                    // For stop_times, insert rows individually to skip invalid foreign keys
                    if (tableName === 'stop_times_ktmb') {
                        const columns = Object.keys(rows[0]);
                        let imported = 0;
                        let failed = 0;
                        
                        for (const row of rows) {
                            const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
                            const values = columns.map(col => row[col] || null);
                            
                            const query = `
                                INSERT INTO gtfs.${tableName} (${columns.join(', ')})
                                VALUES (${placeholders})
                                ON CONFLICT DO NOTHING
                            `;
                            
                            try {
                                await client.query(query, values);
                                imported++;
                            } catch (err) {
                                if (err.code === '23503') {
                                    // Foreign key violation - skip this row
                                    failed++;
                                } else {
                                    throw err;
                                }
                            }
                        }
                        
                        client.release();
                        console.log(`   ✅ Imported ${imported} rows${failed > 0 ? ` (skipped ${failed} invalid rows)` : ''}`);
                        resolve(imported);
                    } else {
                        // Batch insert for other tables
                        const columns = Object.keys(rows[0]);
                        const placeholders = rows.map((_, idx) => {
                            const rowPlaceholders = columns.map((_, colIdx) => 
                                `$${idx * columns.length + colIdx + 1}`
                            ).join(', ');
                            return `(${rowPlaceholders})`;
                        }).join(', ');
                        
                        const values = rows.flatMap(row => columns.map(col => row[col] || null));
                        
                        const query = `
                            INSERT INTO gtfs.${tableName} (${columns.join(', ')})
                            VALUES ${placeholders}
                            ON CONFLICT DO NOTHING
                        `;
                        
                        await client.query(query, values);
                        client.release();
                        
                        console.log(`   ✅ Imported ${rows.length} rows`);
                        resolve(rows.length);
                    }
                } catch (error) {
                    console.error(`   ❌ Database error:`, error.message);
                    reject(error);
                }
            });
    });
}

/**
 * Main import process
 */
async function main() {
    console.log('━'.repeat(60));
    
    try {
        // Step 1: Download
        const downloaded = await downloadKTMBData();
        if (!downloaded) {
            console.error('\n❌ Import aborted: Download failed');
            process.exit(1);
        }
        
        // Step 2: Extract
        const extracted = await extractGTFSZip();
        if (!extracted) {
            console.error('\n❌ Import aborted: Extraction failed');
            process.exit(1);
        }
        
        // Step 3: Clear existing KTMB data
        console.log('\n🧹 Clearing existing KTMB data...');
        try {
            await pool.query('DELETE FROM gtfs.stop_times_ktmb');
            await pool.query('DELETE FROM gtfs.trips_ktmb');
            await pool.query('DELETE FROM gtfs.routes_ktmb');
            await pool.query('DELETE FROM gtfs.stops_ktmb');
            await pool.query('DELETE FROM gtfs.agency_ktmb');
            await pool.query('DELETE FROM gtfs.calendar_ktmb');
            console.log('✅ Existing data cleared');
        } catch (err) {
            if (err.code === '42P01') {
                console.log('   ℹ️  Tables don\'t exist yet, will create...');
            } else {
                console.warn(`   ⚠️  ${err.message}`);
            }
        }
        
        // Step 4: Create schema
        console.log('\n🏗️  Creating database schema...');
        const schemaSQL = fs.readFileSync(
            path.join(__dirname, '../db/gtfs_ktmb_schema.sql'),
            'utf8'
        );
        await pool.query(schemaSQL);
        console.log('✅ Schema created');
        
        // Step 4: Import GTFS files
        console.log('\n📊 Importing GTFS data...');
        console.log('━'.repeat(60));
        
        let totalRows = 0;
        
        totalRows += await importCSV('agency.txt', 'agency_ktmb', ['agency_id', 'agency_name']);
        totalRows += await importCSV('routes.txt', 'routes_ktmb', ['route_id', 'route_long_name', 'route_type']);
        totalRows += await importCSV('stops.txt', 'stops_ktmb', ['stop_id', 'stop_name', 'stop_lat', 'stop_lon']);
        totalRows += await importCSV('trips.txt', 'trips_ktmb', ['trip_id', 'route_id', 'service_id']);
        totalRows += await importCSV('stop_times.txt', 'stop_times_ktmb', ['trip_id', 'stop_id', 'stop_sequence']);
        totalRows += await importCSV('calendar.txt', 'calendar_ktmb', ['service_id']);
        totalRows += await importCSV('calendar_dates.txt', 'calendar_dates_ktmb', []);
        totalRows += await importCSV('shapes.txt', 'shapes_ktmb', ['shape_id', 'shape_pt_sequence']);
        totalRows += await importCSV('frequencies.txt', 'frequencies_ktmb', []);
        totalRows += await importCSV('transfers.txt', 'transfers_ktmb', []);
        totalRows += await importCSV('feed_info.txt', 'feed_info_ktmb', []);
        
        // Step 5: Verify import
        console.log('\n📊 Import Summary:');
        console.log('━'.repeat(60));
        
        const client = await pool.connect();
        
        const tables = [
            'agency_ktmb',
            'routes_ktmb',
            'stops_ktmb',
            'trips_ktmb',
            'stop_times_ktmb',
            'calendar_ktmb',
            'shapes_ktmb'
        ];
        
        for (const table of tables) {
            const result = await client.query(`SELECT COUNT(*) FROM gtfs.${table}`);
            const count = parseInt(result.rows[0].count);
            console.log(`   ${table.padEnd(25)}: ${count.toLocaleString()} rows`);
        }
        
        client.release();
        
        console.log('━'.repeat(60));
        console.log(`\n✅ KTMB import completed! Total: ${totalRows.toLocaleString()} rows`);
        console.log('\n💡 Next steps:');
        console.log('   1. Update transitRoutingService.js to include KTMB category');
        console.log('   2. Restart the server to use KTMB data');
        console.log('   3. Test routing with KTMB stations\n');
        
        // Cleanup
        console.log('🧹 Cleaning up temporary files...');
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        console.log('✅ Cleanup complete\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

main();

