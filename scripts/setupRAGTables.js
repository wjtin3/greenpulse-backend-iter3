import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';

/**
 * Script to set up RAG system tables and seed data
 */
async function setupRAGTables() {
    try {
        console.log('🚀 Setting up RAG system tables...');

        // Read and execute the seed data SQL
        const seedDataPath = path.join(process.cwd(), 'seed_carbon_data.sql');
        const seedData = fs.readFileSync(seedDataPath, 'utf8');

        console.log('📊 Creating RAG system tables...');

        // Create recommendations_kb table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS recommendations_kb (
                id SERIAL PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                context TEXT,
                impact_level VARCHAR(20) NOT NULL,
                difficulty VARCHAR(20) NOT NULL,
                cost_impact VARCHAR(20) NOT NULL,
                tags JSONB DEFAULT '[]',
                embedding JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create carbon_emission_factors table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS carbon_emission_factors (
                id SERIAL PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                subcategory VARCHAR(100),
                name VARCHAR(255) NOT NULL,
                emission_factor DECIMAL(10,6) NOT NULL,
                unit VARCHAR(50) NOT NULL,
                description TEXT,
                malaysian_context TEXT,
                source VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create sync_emission_factors function
        await pool.query(`
            CREATE OR REPLACE FUNCTION sync_emission_factors()
            RETURNS VOID AS $$
            BEGIN
                -- Sync travel emission factors
                INSERT INTO carbon_emission_factors (category, subcategory, name, emission_factor, unit, description, malaysian_context, source)
                SELECT 
                    'travel' as category,
                    vc.category_name as subcategory,
                    vs.size_name as name,
                    vef.emission_value as emission_factor,
                    vef.unit,
                    vs.description,
                    'Malaysian vehicle emission data' as malaysian_context,
                    'Malaysian Transport Database' as source
                FROM vehicle_emission_factor vef
                JOIN vehicle_size vs ON vef.size_id = vs.id
                JOIN vehicle_category vc ON vef.category_id = vc.id
                JOIN fuel_type ft ON vef.fuel_id = ft.id
                ON CONFLICT (category, subcategory, name) DO UPDATE SET
                    emission_factor = EXCLUDED.emission_factor,
                    description = EXCLUDED.description,
                    updated_at = NOW();

                -- Sync household emission factors
                INSERT INTO carbon_emission_factors (category, subcategory, name, emission_factor, unit, description, malaysian_context, source)
                SELECT 
                    'household' as category,
                    hfc.category_name as subcategory,
                    hf.factor_name as name,
                    hf.emission_factor,
                    hf.unit,
                    hf.description,
                    r.region_name as malaysian_context,
                    'Malaysian Household Database' as source
                FROM household_factors hf
                JOIN household_factor_category hfc ON hf.category_id = hfc.id
                LEFT JOIN region r ON hf.region_id = r.id
                ON CONFLICT (category, subcategory, name) DO UPDATE SET
                    emission_factor = EXCLUDED.emission_factor,
                    description = EXCLUDED.description,
                    malaysian_context = EXCLUDED.malaysian_context,
                    updated_at = NOW();

                -- Sync food emission factors
                INSERT INTO carbon_emission_factors (category, subcategory, name, emission_factor, unit, description, malaysian_context, source)
                SELECT 
                    'food' as category,
                    fs.name as subcategory,
                    fe.name as name,
                    fef.value as emission_factor,
                    fef.unit,
                    'Food emission factor' as description,
                    'Malaysian food production data' as malaysian_context,
                    'Malaysian Food Database' as source
                FROM food_emission_factors fef
                JOIN food_entities fe ON fef.entity_id = fe.id
                JOIN food_subcategories fs ON fe.subcategory_id = fs.id
                JOIN food_categories fc ON fs.category_id = fc.id
                ON CONFLICT (category, subcategory, name) DO UPDATE SET
                    emission_factor = EXCLUDED.emission_factor,
                    description = EXCLUDED.description,
                    updated_at = NOW();

                -- Sync shopping emission factors
                INSERT INTO carbon_emission_factors (category, subcategory, name, emission_factor, unit, description, malaysian_context, source)
                SELECT 
                    'shopping' as category,
                    ss.name as subcategory,
                    se.name as name,
                    sef.value as emission_factor,
                    sef.unit,
                    'Shopping emission factor' as description,
                    'Malaysian shopping data' as malaysian_context,
                    'Malaysian Shopping Database' as source
                FROM shopping_emission_factors sef
                JOIN shopping_entities se ON sef.entity_id = se.id
                JOIN shopping_subcategories ss ON se.subcategory_id = ss.id
                JOIN shopping_categories sc ON ss.category_id = sc.id
                ON CONFLICT (category, subcategory, name) DO UPDATE SET
                    emission_factor = EXCLUDED.emission_factor,
                    description = EXCLUDED.description,
                    updated_at = NOW();
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log('✅ RAG system tables created successfully');

        // Execute the seed data
        console.log('🌱 Seeding recommendation data...');
        await pool.query(seedData);

        console.log('✅ Seed data inserted successfully');

        // Create indexes for better performance
        console.log('📈 Creating indexes...');
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_recommendations_kb_category ON recommendations_kb(category);
        `);
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_recommendations_kb_impact_level ON recommendations_kb(impact_level);
        `);
        
        // User tracking indexes removed - no user data collection
        
        // User tracking indexes removed - no user data collection
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_carbon_emission_factors_category ON carbon_emission_factors(category);
        `);

        console.log('✅ Indexes created successfully');

        console.log('🎉 RAG system setup completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Run: node scripts/populateEmbeddings.js');
        console.log('2. Start the server: npm run dev');
        console.log('3. Test the RAG system at: http://localhost:3001/rag-test.html');

    } catch (error) {
        console.error('❌ Error setting up RAG tables:', error);
        process.exit(1);
    }
}

// Run the script if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('setupRAGTables.js');

if (isMainModule) {
    setupRAGTables()
        .then(() => {
            console.log('✅ Setup completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        });
}

export { setupRAGTables };
