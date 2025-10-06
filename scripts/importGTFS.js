#!/usr/bin/env node

/**
 * GTFS Database Import Script
 * Imports parsed GTFS data into Neon PostgreSQL database
 * 
 * Usage:
 *   node scripts/importGTFS.js [options]
 *   node scripts/importGTFS.js --category rapid-bus-mrtfeeder
 *   node scripts/importGTFS.js --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GTFSImporter {
    constructor() {
        this.parsedDir = path.join(__dirname, '..', 'data', 'gtfs', 'parsed');
        this.client = null;
    }

    /**
     * Get available parsed data files
     */
    getAvailableParsedFiles() {
        if (!fs.existsSync(this.parsedDir)) {
            return [];
        }

        return fs.readdirSync(this.parsedDir)
            .filter(file => file.endsWith('_parsed.json'))
            .map(file => {
                const category = file.replace('_parsed.json', '');
                const filePath = path.join(this.parsedDir, file);
                const stats = fs.statSync(filePath);
                return {
                    category: category,
                    fileName: file,
                    filePath: filePath,
                    lastModified: stats.mtime.toISOString()
                };
            });
    }

    /**
     * Connect to database
     */
    async connect() {
        try {
            this.client = await pool.connect();
            console.log('Connected to database successfully');
            return true;
        } catch (error) {
            console.error('Database connection failed:', error.message);
            return false;
        }
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        if (this.client) {
            this.client.release();
            this.client = null;
            console.log('Disconnected from database');
        }
    }

    /**
     * Create GTFS schema and tables
     */
    async createSchema() {
        try {
            console.log('Creating GTFS schema and tables...');
            
            const schemaPath = path.join(__dirname, '..', 'db', 'gtfs_schema.sql');
            const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
            
            await this.client.query(schemaSQL);
            console.log('GTFS schema and tables created successfully');
            return true;
        } catch (error) {
            console.error('Error creating schema:', error.message);
            return false;
        }
    }

    /**
     * Convert category name to table suffix
     */
    getTableSuffix(category) {
        return category.replace(/-/g, '_');
    }

    /**
     * Clear existing data for a category (truncate all tables)
     */
    async clearCategoryData(category) {
        try {
            console.log(`Clearing existing data for category: ${category}`);
            
            const tableSuffix = this.getTableSuffix(category);
            const tables = ['shapes', 'stop_times', 'trips', 'calendar_dates', 'calendar', 'stops', 'routes', 'agency'];
            
            // Clear tables in reverse order to respect foreign key constraints
            const reverseTables = tables.reverse();
            
            for (const table of reverseTables) {
                const tableName = `gtfs.${table}_${tableSuffix}`;
                await this.client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
                console.log(`   Cleared table: ${tableName}`);
            }
            
            console.log(`Cleared existing data for category: ${category}`);
            return true;
        } catch (error) {
            console.error(`Error clearing data for ${category}:`, error.message);
            return false;
        }
    }

    /**
     * Import agency data
     */
    async importAgency(data, category) {
        try {
            if (!data.rows || data.rows.length === 0) {
                console.log('No agency data to import');
                return true;
            }

            console.log(`Importing ${data.rows.length} agency records...`);
            
            const tableSuffix = this.getTableSuffix(category);
            const tableName = `gtfs.agency_${tableSuffix}`;
            
            for (const row of data.rows) {
                const query = `
                    INSERT INTO ${tableName} (
                        agency_id, agency_name, agency_url, agency_timezone, 
                        agency_phone, agency_lang
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (agency_id) DO UPDATE SET
                        agency_name = EXCLUDED.agency_name,
                        agency_url = EXCLUDED.agency_url,
                        agency_timezone = EXCLUDED.agency_timezone,
                        agency_phone = EXCLUDED.agency_phone,
                        agency_lang = EXCLUDED.agency_lang,
                        updated_at = CURRENT_TIMESTAMP
                `;
                
                await this.client.query(query, [
                    row.agency_id || 'default',
                    row.agency_name,
                    row.agency_url,
                    row.agency_timezone,
                    row.agency_phone,
                    row.agency_lang
                ]);
            }
            
            console.log(`Imported ${data.rows.length} agency records`);
            return true;
        } catch (error) {
            console.error('Error importing agency data:', error.message);
            return false;
        }
    }

    /**
     * Import routes data
     */
    async importRoutes(data, category) {
        try {
            if (!data.rows || data.rows.length === 0) {
                console.log('No routes data to import');
                return true;
            }

            console.log(`Importing ${data.rows.length} route records...`);
            
            const tableSuffix = this.getTableSuffix(category);
            const tableName = `gtfs.routes_${tableSuffix}`;
            const agencyTableName = `gtfs.agency_${tableSuffix}`;
            
            for (const row of data.rows) {
                // Handle missing agency_id by using a default or null
                let agencyId = row.agency_id;
                if (!agencyId || agencyId.trim() === '') {
                    // Check if we have a default agency for this category
                    const defaultAgencyResult = await this.client.query(
                        `SELECT agency_id FROM ${agencyTableName} LIMIT 1`
                    );
                    agencyId = defaultAgencyResult.rows.length > 0 ? defaultAgencyResult.rows[0].agency_id : 'default';
                }

                const query = `
                    INSERT INTO ${tableName} (
                        route_id, agency_id, route_short_name, route_long_name, 
                        route_type
                    ) VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (route_id) DO UPDATE SET
                        agency_id = EXCLUDED.agency_id,
                        route_short_name = EXCLUDED.route_short_name,
                        route_long_name = EXCLUDED.route_long_name,
                        route_type = EXCLUDED.route_type,
                        updated_at = CURRENT_TIMESTAMP
                `;
                
                await this.client.query(query, [
                    row.route_id,
                    agencyId,
                    row.route_short_name,
                    row.route_long_name,
                    parseInt(row.route_type) || 3 // Default to bus
                ]);
            }
            
            console.log(`Imported ${data.rows.length} route records`);
            return true;
        } catch (error) {
            console.error('Error importing routes data:', error.message);
            return false;
        }
    }

    /**
     * Import stops data
     */
    async importStops(data, category) {
        try {
            if (!data.rows || data.rows.length === 0) {
                console.log('No stops data to import');
                return true;
            }

            console.log(`Importing ${data.rows.length} stop records...`);
            
            const tableSuffix = this.getTableSuffix(category);
            const tableName = `gtfs.stops_${tableSuffix}`;
            
            for (const row of data.rows) {
                const query = `
                    INSERT INTO ${tableName} (
                        stop_id, stop_code, stop_name, stop_lat, stop_lon
                    ) VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (stop_id) DO UPDATE SET
                        stop_code = EXCLUDED.stop_code,
                        stop_name = EXCLUDED.stop_name,
                        stop_lat = EXCLUDED.stop_lat,
                        stop_lon = EXCLUDED.stop_lon,
                        updated_at = CURRENT_TIMESTAMP
                `;
                
                await this.client.query(query, [
                    row.stop_id,
                    row.stop_code,
                    row.stop_name,
                    parseFloat(row.stop_lat),
                    parseFloat(row.stop_lon)
                ]);
            }
            
            console.log(`Imported ${data.rows.length} stop records`);
            return true;
        } catch (error) {
            console.error('Error importing stops data:', error.message);
            return false;
        }
    }

    /**
     * Import calendar data
     */
    async importCalendar(data, category) {
        try {
            if (!data.rows || data.rows.length === 0) {
                console.log('No calendar data to import');
                return true;
            }

            console.log(`Importing ${data.rows.length} calendar records...`);
            
            const tableSuffix = this.getTableSuffix(category);
            const tableName = `gtfs.calendar_${tableSuffix}`;
            
            for (const row of data.rows) {
                const query = `
                    INSERT INTO ${tableName} (
                        service_id, monday, tuesday, wednesday, thursday, 
                        friday, saturday, sunday, start_date, end_date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (service_id) DO UPDATE SET
                        monday = EXCLUDED.monday,
                        tuesday = EXCLUDED.tuesday,
                        wednesday = EXCLUDED.wednesday,
                        thursday = EXCLUDED.thursday,
                        friday = EXCLUDED.friday,
                        saturday = EXCLUDED.saturday,
                        sunday = EXCLUDED.sunday,
                        start_date = EXCLUDED.start_date,
                        end_date = EXCLUDED.end_date,
                        updated_at = CURRENT_TIMESTAMP
                `;
                
                await this.client.query(query, [
                    row.service_id,
                    row.monday === '1' || row.monday === 1,
                    row.tuesday === '1' || row.tuesday === 1,
                    row.wednesday === '1' || row.wednesday === 1,
                    row.thursday === '1' || row.thursday === 1,
                    row.friday === '1' || row.friday === 1,
                    row.saturday === '1' || row.saturday === 1,
                    row.sunday === '1' || row.sunday === 1,
                    row.start_date,
                    row.end_date
                ]);
            }
            
            console.log(`Imported ${data.rows.length} calendar records`);
            return true;
        } catch (error) {
            console.error('Error importing calendar data:', error.message);
            return false;
        }
    }

    /**
     * Import calendar dates data
     */
    async importCalendarDates(data, category) {
        try {
            if (!data.rows || data.rows.length === 0) {
                console.log('No calendar dates data to import');
                return true;
            }

            console.log(`Importing ${data.rows.length} calendar dates records...`);
            
            const tableSuffix = this.getTableSuffix(category);
            const tableName = `gtfs.calendar_dates_${tableSuffix}`;
            
            for (const row of data.rows) {
                const query = `
                    INSERT INTO ${tableName} (
                        service_id, date, exception_type
                    ) VALUES ($1, $2, $3)
                    ON CONFLICT (service_id, date) DO UPDATE SET
                        exception_type = EXCLUDED.exception_type
                `;
                
                await this.client.query(query, [
                    row.service_id,
                    row.date,
                    parseInt(row.exception_type)
                ]);
            }
            
            console.log(`Imported ${data.rows.length} calendar dates records`);
            return true;
        } catch (error) {
            console.error('Error importing calendar dates data:', error.message);
            return false;
        }
    }

    /**
     * Import trips data
     */
    async importTrips(data, category) {
        try {
            if (!data.rows || data.rows.length === 0) {
                console.log('No trips data to import');
                return true;
            }

            console.log(`Importing ${data.rows.length} trip records...`);
            
            const tableSuffix = this.getTableSuffix(category);
            const tableName = `gtfs.trips_${tableSuffix}`;
            
            for (const row of data.rows) {
                const query = `
                    INSERT INTO ${tableName} (
                        route_id, service_id, trip_id, trip_headsign, 
                        direction_id, shape_id
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (trip_id) DO UPDATE SET
                        route_id = EXCLUDED.route_id,
                        service_id = EXCLUDED.service_id,
                        trip_headsign = EXCLUDED.trip_headsign,
                        direction_id = EXCLUDED.direction_id,
                        shape_id = EXCLUDED.shape_id,
                        updated_at = CURRENT_TIMESTAMP
                `;
                
                await this.client.query(query, [
                    row.route_id,
                    row.service_id,
                    row.trip_id,
                    row.trip_headsign,
                    row.direction_id ? parseInt(row.direction_id) : null,
                    row.shape_id
                ]);
            }
            
            console.log(`Imported ${data.rows.length} trip records`);
            return true;
        } catch (error) {
            console.error('Error importing trips data:', error.message);
            return false;
        }
    }

    /**
     * Import stop times data (batch processing for large datasets)
     */
    async importStopTimes(data, category) {
        try {
            if (!data.rows || data.rows.length === 0) {
                console.log('No stop times data to import');
                return true;
            }

            console.log(`Importing ${data.rows.length} stop times records...`);
            
            const tableSuffix = this.getTableSuffix(category);
            const tableName = `gtfs.stop_times_${tableSuffix}`;
            const batchSize = 1000;
            const batches = Math.ceil(data.rows.length / batchSize);
            
            for (let i = 0; i < batches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize, data.rows.length);
                const batch = data.rows.slice(start, end);
                
                console.log(`Processing batch ${i + 1}/${batches} (${start + 1}-${end})`);
                
                for (const row of batch) {
                    // Handle 24+ hour times by converting to proper format
                    const formatTime = (timeStr) => {
                        if (!timeStr) return null;
                        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
                        if (hours >= 24) {
                            const adjustedHours = hours - 24;
                            return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        }
                        return timeStr;
                    };

                    const query = `
                        INSERT INTO ${tableName} (
                            trip_id, arrival_time, departure_time, stop_id, 
                            stop_sequence, stop_headsign, shape_dist_traveled
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (trip_id, stop_sequence) DO UPDATE SET
                            arrival_time = EXCLUDED.arrival_time,
                            departure_time = EXCLUDED.departure_time,
                            stop_id = EXCLUDED.stop_id,
                            stop_headsign = EXCLUDED.stop_headsign,
                            shape_dist_traveled = EXCLUDED.shape_dist_traveled
                    `;
                    
                    await this.client.query(query, [
                        row.trip_id,
                        formatTime(row.arrival_time),
                        formatTime(row.departure_time),
                        row.stop_id,
                        parseInt(row.stop_sequence),
                        row.stop_headsign,
                        row.shape_dist_traveled ? parseFloat(row.shape_dist_traveled) : null
                    ]);
                }
            }
            
            console.log(`Imported ${data.rows.length} stop times records`);
            return true;
        } catch (error) {
            console.error('Error importing stop times data:', error.message);
            return false;
        }
    }

    /**
     * Import shapes data (batch processing for large datasets)
     */
    async importShapes(data, category) {
        try {
            if (!data.rows || data.rows.length === 0) {
                console.log('No shapes data to import');
                return true;
            }

            console.log(`Importing ${data.rows.length} shape records...`);
            
            const tableSuffix = this.getTableSuffix(category);
            const tableName = `gtfs.shapes_${tableSuffix}`;
            const batchSize = 1000;
            const batches = Math.ceil(data.rows.length / batchSize);
            
            for (let i = 0; i < batches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize, data.rows.length);
                const batch = data.rows.slice(start, end);
                
                console.log(`Processing batch ${i + 1}/${batches} (${start + 1}-${end})`);
                
                for (const row of batch) {
                    const query = `
                        INSERT INTO ${tableName} (
                            shape_id, shape_pt_lat, shape_pt_lon, 
                            shape_pt_sequence, shape_dist_traveled
                        ) VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (shape_id, shape_pt_sequence) DO UPDATE SET
                            shape_pt_lat = EXCLUDED.shape_pt_lat,
                            shape_pt_lon = EXCLUDED.shape_pt_lon,
                            shape_dist_traveled = EXCLUDED.shape_dist_traveled
                    `;
                    
                    await this.client.query(query, [
                        row.shape_id,
                        parseFloat(row.shape_pt_lat),
                        parseFloat(row.shape_pt_lon),
                        parseInt(row.shape_pt_sequence),
                        row.shape_dist_traveled ? parseFloat(row.shape_dist_traveled) : null
                    ]);
                }
            }
            
            console.log(`Imported ${data.rows.length} shape records`);
            return true;
        } catch (error) {
            console.error('Error importing shapes data:', error.message);
            return false;
        }
    }

    /**
     * Import all data for a category
     */
    async importCategory(category) {
        try {
            console.log(`\nImporting GTFS data for category: ${category}`);
            console.log('='.repeat(50));

            // Load parsed data
            const parsedFile = path.join(this.parsedDir, `${category}_parsed.json`);
            if (!fs.existsSync(parsedFile)) {
                console.error(`Parsed data file not found: ${parsedFile}`);
                return { success: false, error: 'Parsed data file not found' };
            }

            const parsedData = JSON.parse(fs.readFileSync(parsedFile, 'utf-8'));
            console.log(`Loaded parsed data from: ${parsedData.sourceZip}`);

            // Clear existing data
            await this.clearCategoryData(category);

            // Import data in correct order (respecting foreign key constraints)
            const importResults = {};

            // 1. Agency
            importResults.agency = await this.importAgency(parsedData.files.agency, category);

            // 2. Routes
            importResults.routes = await this.importRoutes(parsedData.files.routes, category);

            // 3. Stops
            importResults.stops = await this.importStops(parsedData.files.stops, category);

            // 4. Calendar
            importResults.calendar = await this.importCalendar(parsedData.files.calendar, category);

            // 5. Calendar Dates
            importResults.calendar_dates = await this.importCalendarDates(parsedData.files.calendar_dates, category);

            // 6. Trips
            importResults.trips = await this.importTrips(parsedData.files.trips, category);

            // 7. Stop Times
            importResults.stop_times = await this.importStopTimes(parsedData.files.stop_times, category);

            // 8. Shapes
            importResults.shapes = await this.importShapes(parsedData.files.shapes, category);

            const successCount = Object.values(importResults).filter(result => result === true).length;
            const totalCount = Object.keys(importResults).length;

            console.log(`\nImport completed: ${successCount}/${totalCount} tables imported successfully`);

            return {
                success: successCount === totalCount,
                category: category,
                results: importResults,
                sourceZip: parsedData.sourceZip
            };

        } catch (error) {
            console.error(`Error importing category ${category}:`, error.message);
            return { success: false, category: category, error: error.message };
        }
    }

    /**
     * Import all available categories
     */
    async importAllCategories() {
        const parsedFiles = this.getAvailableParsedFiles();
        if (parsedFiles.length === 0) {
            console.log('No parsed data files found');
            return [];
        }

        const results = [];
        for (const file of parsedFiles) {
            const result = await this.importCategory(file.category);
            results.push(result);
        }

        return results;
    }

    /**
     * Get import summary
     */
    getImportSummary(results) {
        const summary = {
            totalCategories: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            categories: {}
        };

        results.forEach(result => {
            if (result.success) {
                summary.categories[result.category] = {
                    sourceZip: result.sourceZip,
                    importedTables: Object.keys(result.results).filter(table => result.results[table] === true)
                };
            } else {
                summary.categories[result.category] = {
                    error: result.error
                };
            }
        });

        return summary;
    }
}

// Command line interface
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        category: null,
        all: false,
        help: false,
        schema: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--category':
            case '-c':
                if (i + 1 < args.length) {
                    options.category = args[i + 1];
                    i++;
                }
                break;
            case '--all':
            case '-a':
                options.all = true;
                break;
            case '--schema':
            case '-s':
                options.schema = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    }

    return options;
}

function showHelp() {
    console.log(`
GTFS Database Import Script
===========================

Imports parsed GTFS data into Neon PostgreSQL database.

Usage:
  node scripts/importGTFS.js [options]

Options:
  -c, --category <name>    Import specific category
  -a, --all               Import all available categories
  -s, --schema            Create schema and tables only
  -h, --help              Show this help message

Available Categories:
  rapid-bus-mrtfeeder      Buses that bring passengers to MRT stations
  rapid-rail-kl            KL rail services (LRT, MRT, Monorail)
  rapid-bus-kl             KL bus services

Examples:
  # Create schema and tables
  node scripts/importGTFS.js --schema

  # Import all categories
  node scripts/importGTFS.js --all

  # Import specific category
  node scripts/importGTFS.js --category rapid-bus-mrtfeeder

Prerequisites:
  - Parsed GTFS data files in data/gtfs/parsed/
  - Database connection configured in config/database.js
`);
}

// Main execution
async function main() {
    const options = parseArgs();
    
    if (options.help) {
        showHelp();
        return;
    }

    const importer = new GTFSImporter();

    try {
        console.log('GTFS Database Import Script');
        console.log('============================\n');

        // Connect to database
        const connected = await importer.connect();
        if (!connected) {
            process.exit(1);
        }

        // Create schema if requested
        if (options.schema) {
            const schemaCreated = await importer.createSchema();
            if (!schemaCreated) {
                process.exit(1);
            }
            return;
        }

        let results;
        
        if (options.category) {
            // Validate category
            const availableFiles = importer.getAvailableParsedFiles();
            const availableCategories = availableFiles.map(f => f.category);
            
            if (!availableCategories.includes(options.category)) {
                console.error(`Invalid category: ${options.category}`);
                console.error(`Available categories: ${availableCategories.join(', ')}`);
                process.exit(1);
            }
            
            results = [await importer.importCategory(options.category)];
        } else if (options.all) {
            results = await importer.importAllCategories();
        } else {
            console.log('Please specify --category <name>, --all, or --schema');
            console.log('Use --help for more information');
            return;
        }

        // Display summary
        console.log('\nImport Summary:');
        console.log('===============');
        
        const summary = importer.getImportSummary(results);
        console.log(`Total categories: ${summary.totalCategories}`);
        console.log(`Successful: ${summary.successful}`);
        console.log(`Failed: ${summary.failed}`);

        if (summary.successful > 0) {
            console.log('\nImported categories:');
            Object.entries(summary.categories).forEach(([category, data]) => {
                if (data.sourceZip) {
                    console.log(`\n${category}:`);
                    console.log(`   Source: ${data.sourceZip}`);
                    console.log(`   Tables: ${data.importedTables.join(', ')}`);
                }
            });
        }

        if (summary.failed > 0) {
            console.log('\nFailed categories:');
            Object.entries(summary.categories).forEach(([category, data]) => {
                if (data.error) {
                    console.log(`   ${category}: ${data.error}`);
                }
            });
        }

    } catch (error) {
        console.error('Script execution failed:', error.message);
        process.exit(1);
    } finally {
        await importer.disconnect();
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

export default GTFSImporter;
