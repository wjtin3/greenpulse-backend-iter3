import { pool, testConnection } from '../config/database.js';

const createTables = async () => {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const client = await pool.connect();

    // Read and execute the schema file
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one transaction
    try {
      await client.query('BEGIN');
      await client.query(schemaSQL);
      await client.query('COMMIT');
      console.log('Database schema loaded successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error executing schema:', error.message);
      throw error;
    }

    // Calculations are no longer stored - removed carbon_footprint_calculations table
    
    console.log('All tables created successfully');
    
    client.release();
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

// Run migration
createTables()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
