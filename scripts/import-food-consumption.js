import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV parser that handles quoted fields with commas
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

// Import food consumption data
const importFoodConsumption = async () => {
  try {
    const client = await pool.connect();
    
    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'data', 'food_consumption.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const { headers, data } = parseCSVWithQuotes(csvData);
    
    console.log(`\n📁 Importing food_consumption from ${path.basename(csvPath)}`);
    console.log(`📊 Headers: ${headers.join(', ')}`);
    console.log(`📈 Found ${data.length} rows to import`);
    
    // Clear existing data first
    console.log('🧹 Clearing existing food_consumption data...');
    await client.query('DELETE FROM food_consumption');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Insert data row by row
    for (const row of data) {
      try {
        // Map the CSV columns to our table columns
        const entity = row['Entiry'] || row['Entity'] || ''; // Handle typo in CSV header
        const dairyConsumptionGrams = row['Dairy consumption (gram)'] || '0';
        
        // Skip empty rows
        if (!entity || entity.trim() === '') {
          continue;
        }
        
        const query = `
          INSERT INTO food_consumption (entity, dairy_consumption_grams) 
          VALUES ($1, $2)
        `;
        
        await client.query(query, [entity.trim(), parseFloat(dairyConsumptionGrams) || 0]);
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
    
    // Verify the import
    const verifyClient = await pool.connect();
    const result = await verifyClient.query('SELECT COUNT(*) as count FROM food_consumption');
    console.log(`📊 Total rows in food_consumption table: ${result.rows[0].count}`);
    
    // Show sample data
    const sampleResult = await verifyClient.query('SELECT * FROM food_consumption LIMIT 5');
    console.log('\n📋 Sample data:');
    sampleResult.rows.forEach(row => {
      console.log(`   ${row.entity}: ${row.dairy_consumption_grams} grams`);
    });
    
    verifyClient.release();
    
  } catch (error) {
    console.error(`❌ Error importing food_consumption:`, error.message);
    throw error;
  }
};

// Run import
importFoodConsumption()
  .then(() => {
    console.log('\n🎉 Food consumption data import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Food consumption import failed:', error);
    process.exit(1);
  });
