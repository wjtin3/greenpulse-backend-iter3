import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as schema from '../db/schema.js';

dotenv.config();

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: process.env.NODE_ENV === 'production' ? 3 : 20, // Allow 3 concurrent connections in serverless
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for acquiring connection
  statement_timeout: 15000, // Timeout individual queries after 15 seconds
  query_timeout: 15000, // Additional query timeout
  allowExitOnIdle: true, // Allow process to exit when idle
};

// Create connection pool
const pool = new Pool(dbConfig);

// Create Drizzle instance with error handling
let db;
try {
  db = drizzle(pool, { schema });
  console.log('Drizzle database instance created successfully');
} catch (error) {
  console.error('Failed to create Drizzle database instance:', error);
  throw error;
}

export { db };

// Export pool for backward compatibility
export { pool };

// Test database connection and set query timeout
pool.on('connect', (client) => {
  console.log('Connected to the database');
  // Set statement timeout for all queries on this connection (15 seconds)
  client.query('SET statement_timeout = 15000'); // milliseconds
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to test connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connection test successful');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  }
};
