import { cohereService } from '../services/cohereService.js';
import { pool } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to populate embeddings for existing recommendations in the database
 * Run this after inserting recommendations without embeddings
 */
async function populateEmbeddings() {
    try {
        console.log('🚀 Starting embedding population...');

        // Get all recommendations without embeddings
        const result = await pool.query(`
            SELECT * FROM recommendations_kb 
            WHERE embedding IS NULL
        `);

        const recommendations = result.rows;

        if (!recommendations || recommendations.length === 0) {
            console.log('✅ No recommendations found without embeddings');
            return;
        }

        console.log(`📊 Found ${recommendations.length} recommendations to process`);

        // Process recommendations in batches
        const batchSize = 5;
        for (let i = 0; i < recommendations.length; i += batchSize) {
            const batch = recommendations.slice(i, i + batchSize);
            console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recommendations.length / batchSize)}`);

            const batchPromises = batch.map(async (rec) => {
                try {
                    // Generate embedding
                    const embedding = await cohereService.generateRecommendationEmbedding({
                        title: rec.title,
                        content: rec.content,
                        category: rec.category,
                        context: rec.context,
                        tags: Array.isArray(rec.tags) ? rec.tags : JSON.parse(rec.tags || '[]')
                    });

                    // Update the recommendation with embedding
                    await pool.query(`
                        UPDATE recommendations_kb 
                        SET embedding = $1, updated_at = NOW()
                        WHERE id = $2
                    `, [JSON.stringify(embedding), rec.id]);

                    console.log(`✅ Updated embedding for: ${rec.title}`);
                    return true;
                } catch (error) {
                    console.error(`❌ Error processing recommendation ${rec.id}:`, error);
                    return false;
                }
            });

            const results = await Promise.all(batchPromises);
            const successCount = results.filter(Boolean).length;
            console.log(`✅ Batch completed: ${successCount}/${batch.length} successful`);

            // Small delay between batches to avoid rate limits
            if (i + batchSize < recommendations.length) {
                console.log('⏳ Waiting 2 seconds before next batch...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.log('🎉 Embedding population completed!');
    } catch (error) {
        console.error('❌ Error populating embeddings:', error);
        process.exit(1);
    }
}

// Run the script if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('populateEmbeddings.js');

if (isMainModule) {
    populateEmbeddings()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

export { populateEmbeddings };
