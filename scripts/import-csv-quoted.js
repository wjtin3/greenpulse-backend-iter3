import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Advanced CSV parser that handles quoted fields with commas
const parseCSVWithQuotes = (csvData) => {
  const lines = csvData.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return { headers, data };
};

// Parse a single CSV line handling quoted fields
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  values.push(current.trim());
  
  return values;
};

// Import CSV with advanced parsing
const importCSV = async (tableName, csvFilePath) => {
  try {
    const client = await pool.connect();
    
    // Read CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const { headers, data } = parseCSVWithQuotes(csvData);
    
    console.log(`\n📁 Importing ${tableName} from ${path.basename(csvFilePath)}`);
    console.log(`📊 Headers: ${headers.join(', ')}`);
    console.log(`📈 Found ${data.length} rows to import`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Insert data row by row
    for (const row of data) {
      try {
        const columnsList = Object.keys(row).join(', ');
        const valuesList = Object.values(row).map(v => {
          // Handle different data types
          if (v === '' || v === null || v === undefined) {
            return 'NULL';
          }
          // Check if it's a number
          if (!isNaN(v) && !isNaN(parseFloat(v))) {
            return v;
          }
          // It's a string, escape single quotes
          return `'${v.replace(/'/g, "''")}'`;
        }).join(', ');
        
        const query = `INSERT INTO ${tableName} (${columnsList}) VALUES (${valuesList})`;
        await client.query(query);
        successCount++;
        
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) { // Only show first 5 errors
          console.warn(`⚠️  Row error: ${error.message}`);
          console.warn(`   Data: ${JSON.stringify(row)}`);
        }
      }
    }
    
    client.release();
    
    if (errorCount > 0) {
      console.log(`✅ Imported ${successCount} rows, ${errorCount} errors`);
    } else {
      console.log(`✅ Successfully imported ${successCount} rows`);
    }
    
  } catch (error) {
    console.error(`❌ Error importing ${tableName}:`, error.message);
    throw error;
  }
};

// Import all CSV files with advanced parsing
const importAllCSVs = async () => {
  try {
    console.log('🚀 Starting advanced CSV import process...');
    
    const dataDir = path.join(__dirname, '..', 'data');
    
    // Import in dependency order
    const imports = [
      // Food hierarchy
      { table: 'food_categories', file: 'food_categories.csv' },
      { table: 'food_subcategories', file: 'food_subcategories.csv' },
      { table: 'food_entities', file: 'food_entities.csv' },
      { table: 'food_emission_factors', file: 'food_emission_factors.csv' },
      
      // Shopping hierarchy  
      { table: 'shopping_categories', file: 'shopping_categories.csv' },
      { table: 'shopping_subcategories', file: 'shopping_subcategories.csv' },
      { table: 'shopping_entities', file: 'shopping_entities.csv' },
      { table: 'shopping_emission_factors', file: 'shopping_emission_factors.csv' },
      
      // Vehicle hierarchy
      { table: 'vehicle_category', file: 'vehicle_category.csv' },
      { table: 'fuel_type', file: 'fuel_type.csv' },
      { table: 'vehicle_size', file: 'vehicle_size.csv' },
      { table: 'vehicle_emission_factor', file: 'vehicle_emission_factor.csv' },
      
      // Other tables
      { table: 'public_transport', file: 'public_transport.csv' },
      { table: 'region', file: 'region.csv' },
      { table: 'household_factor_category', file: 'household_factor_category.csv' },
      { table: 'household_factors', file: 'household_factors.csv' }
    ];
    
    for (const importConfig of imports) {
      const csvPath = path.join(dataDir, importConfig.file);
      
      if (fs.existsSync(csvPath)) {
        await importCSV(importConfig.table, csvPath);
      } else {
        console.log(`⚠️  CSV file not found: ${importConfig.file}`);
      }
    }
    
    console.log('\n🎉 Advanced CSV import process completed!');
    
  } catch (error) {
    console.error('❌ CSV import failed:', error.message);
    throw error;
  }
};

// Run import
importAllCSVs()
  .then(() => {
    console.log('✅ All CSV files imported successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ CSV import failed:', error);
    process.exit(1);
  });
