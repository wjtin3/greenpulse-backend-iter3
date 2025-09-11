import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script to populate carbon_emission_factors table from existing CSV data
 */
async function populateEmissionFactors() {
    try {
        console.log('🚀 Starting emission factors population...');

        // Clear existing data
        await pool.query('DELETE FROM carbon_emission_factors');
        console.log('🧹 Cleared existing emission factors');

        // Read and process vehicle emission factors
        await populateVehicleEmissionFactors();
        
        // Read and process food emission factors
        await populateFoodEmissionFactors();
        
        // Read and process shopping emission factors
        await populateShoppingEmissionFactors();
        
        // Read and process household emission factors
        await populateHouseholdEmissionFactors();

        console.log('✅ Emission factors population completed successfully!');

    } catch (error) {
        console.error('❌ Error populating emission factors:', error);
        throw error;
    }
}

async function populateVehicleEmissionFactors() {
    try {
        console.log('📊 Processing vehicle emission factors...');
        
        const csvPath = path.join(__dirname, '../data/vehicle_emission_factor.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.trim().split('\n');
        
        // Skip header
        const dataLines = lines.slice(1);
        
        for (const line of dataLines) {
            const [id, categoryId, sizeId, fuelId, emissionValue, unit] = line.split(',');
            
            // Get category name
            const categoryResult = await pool.query('SELECT category_name FROM vehicle_category WHERE id = $1', [categoryId]);
            const category = categoryResult.rows[0]?.category_name || 'Unknown';
            
            // Get size name
            const sizeResult = await pool.query('SELECT size_name FROM vehicle_size WHERE id = $1', [sizeId]);
            const size = sizeResult.rows[0]?.size_name || 'Unknown';
            
            // Get fuel type
            const fuelResult = await pool.query('SELECT fuel_name FROM fuel_type WHERE id = $1', [fuelId]);
            const fuel = fuelResult.rows[0]?.fuel_name || 'Unknown';
            
            const name = `${category} - ${size} (${fuel})`;
            const description = `Emission factor for ${category} vehicles of ${size} size using ${fuel} fuel`;
            const malaysianContext = `Malaysian ${category} vehicles typically use ${fuel} fuel. ${size} vehicles are common in Malaysian cities.`;
            
            await pool.query(`
                INSERT INTO carbon_emission_factors (category, subcategory, name, emission_factor, unit, description, malaysian_context)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'travel',
                category,
                name,
                parseFloat(emissionValue),
                unit,
                description,
                malaysianContext
            ]);
        }
        
        console.log(`✅ Processed ${dataLines.length} vehicle emission factors`);
    } catch (error) {
        console.error('❌ Error processing vehicle emission factors:', error);
        throw error;
    }
}

async function populateFoodEmissionFactors() {
    try {
        console.log('🍎 Processing food emission factors...');
        
        const csvPath = path.join(__dirname, '../data/food_emission_factors.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.trim().split('\n');
        
        // Skip header
        const dataLines = lines.slice(1);
        
        for (const line of dataLines) {
            const [id, entityId, value, unit] = line.split(',');
            
            // Get entity name
            const entityResult = await pool.query('SELECT name FROM food_entities WHERE id = $1', [entityId]);
            const entity = entityResult.rows[0]?.name || 'Unknown';
            
            // Get subcategory
            const subcategoryResult = await pool.query(`
                SELECT fc.name as category_name, fs.name as subcategory_name 
                FROM food_entities fe 
                JOIN food_subcategories fs ON fe.subcategory_id = fs.id 
                JOIN food_categories fc ON fs.category_id = fc.id 
                WHERE fe.id = $1
            `, [entityId]);
            
            const subcategory = subcategoryResult.rows[0]?.subcategory_name || 'Unknown';
            const categoryName = subcategoryResult.rows[0]?.category_name || 'Unknown';
            
            const description = `Carbon emission factor for ${entity} production and processing`;
            const malaysianContext = `${entity} is commonly consumed in Malaysia. Local production and import patterns affect its carbon footprint.`;
            
            await pool.query(`
                INSERT INTO carbon_emission_factors (category, subcategory, name, emission_factor, unit, description, malaysian_context)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'food',
                subcategory,
                entity,
                parseFloat(value),
                unit,
                description,
                malaysianContext
            ]);
        }
        
        console.log(`✅ Processed ${dataLines.length} food emission factors`);
    } catch (error) {
        console.error('❌ Error processing food emission factors:', error);
        throw error;
    }
}

async function populateShoppingEmissionFactors() {
    try {
        console.log('🛍️ Processing shopping emission factors...');
        
        const csvPath = path.join(__dirname, '../data/shopping_emission_factors.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.trim().split('\n');
        
        // Skip header
        const dataLines = lines.slice(1);
        
        for (const line of dataLines) {
            const [id, entityId, value, unit] = line.split(',');
            
            // Get entity name
            const entityResult = await pool.query('SELECT name FROM shopping_entities WHERE id = $1', [entityId]);
            const entity = entityResult.rows[0]?.name || 'Unknown';
            
            // Get subcategory
            const subcategoryResult = await pool.query(`
                SELECT sc.name as category_name, ss.name as subcategory_name 
                FROM shopping_entities se 
                JOIN shopping_subcategories ss ON se.subcategory_id = ss.id 
                JOIN shopping_categories sc ON ss.category_id = sc.id 
                WHERE se.id = $1
            `, [entityId]);
            
            const subcategory = subcategoryResult.rows[0]?.subcategory_name || 'Unknown';
            const categoryName = subcategoryResult.rows[0]?.category_name || 'Unknown';
            
            const description = `Carbon emission factor for ${entity} production, transport, and retail`;
            const malaysianContext = `${entity} is commonly purchased in Malaysia. Consider local vs imported options for lower carbon footprint.`;
            
            await pool.query(`
                INSERT INTO carbon_emission_factors (category, subcategory, name, emission_factor, unit, description, malaysian_context)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'shopping',
                subcategory,
                entity,
                parseFloat(value),
                unit,
                description,
                malaysianContext
            ]);
        }
        
        console.log(`✅ Processed ${dataLines.length} shopping emission factors`);
    } catch (error) {
        console.error('❌ Error processing shopping emission factors:', error);
        throw error;
    }
}

async function populateHouseholdEmissionFactors() {
    try {
        console.log('🏠 Processing household emission factors...');
        
        const csvPath = path.join(__dirname, '../data/household_factors.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.trim().split('\n');
        
        // Skip header
        const dataLines = lines.slice(1);
        
        for (const line of dataLines) {
            const [id, factorName, categoryId, regionId, unit, emissionFactor, description] = line.split(',');
            
            // Get category name
            const categoryResult = await pool.query('SELECT category_name FROM household_factor_category WHERE id = $1', [categoryId]);
            const category = categoryResult.rows[0]?.category_name || 'Unknown';
            
            // Get region name
            const regionResult = await pool.query('SELECT region_name FROM region WHERE id = $1', [regionId]);
            const region = regionResult.rows[0]?.region_name || 'Unknown';
            
            const name = `${factorName} - ${region}`;
            const malaysianContext = `${region} region in Malaysia has specific characteristics affecting ${factorName} emissions.`;
            
            await pool.query(`
                INSERT INTO carbon_emission_factors (category, subcategory, name, emission_factor, unit, description, malaysian_context)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'household',
                category,
                name,
                parseFloat(emissionFactor),
                unit,
                description,
                malaysianContext
            ]);
        }
        
        console.log(`✅ Processed ${dataLines.length} household emission factors`);
    } catch (error) {
        console.error('❌ Error processing household emission factors:', error);
        throw error;
    }
}

// Check if this script is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('populateEmissionFactors.js');

if (isMainModule) {
    populateEmissionFactors()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

export { populateEmissionFactors };
