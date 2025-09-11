import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as schema from '../db/schema.js';

dotenv.config();

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: process.env.NODE_ENV === 'production' ? 1 : 20, // Limit connections in serverless
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Increase timeout for serverless
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

// Test database connection
pool.on('connect', () => {
  console.log('Connected to the database');
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
