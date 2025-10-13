// Test database configuration for Vercel
import { Pool } from 'pg';

// Use Vercel database URL for testing
const testPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1, // Limit connections for tests
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export { testPool as pool };
