#!/usr/bin/env node

/**
 * Reset GTFS Schema Script
 * Drops existing GTFS schema and recreates it with separate tables
 */

import { pool } from '../config/database.js';

async function resetGTFSSchema() {
    const client = await pool.connect();
    
    try {
        console.log('Dropping existing GTFS schema...');
        
        // Drop the entire schema and recreate it
        await client.query('DROP SCHEMA IF EXISTS gtfs CASCADE');
        console.log('Dropped existing GTFS schema');
        
        console.log('Creating new GTFS schema...');
        
        // Read and execute the schema file
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const schemaPath = path.join(__dirname, '..', 'db', 'gtfs_schema.sql');
        
        const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
        await client.query(schemaSQL);
        
        console.log('GTFS schema created successfully with separate tables');
        
        // List created tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'gtfs' 
            ORDER BY table_name
        `);
        
        console.log('\nCreated tables:');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('Error resetting GTFS schema:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    resetGTFSSchema()
        .then(() => {
            console.log('\nSchema reset completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Schema reset failed:', error);
            process.exit(1);
        });
}

export default resetGTFSSchema;

