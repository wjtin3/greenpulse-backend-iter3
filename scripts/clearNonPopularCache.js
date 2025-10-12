#!/usr/bin/env node

/**
 * Clear route cache EXCEPT popular routes
 * This keeps the pre-cached popular routes while clearing ad-hoc user routes
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { popularRoutes } from '../config/popularRoutes.js';
import { popularTransitRoutes } from '../config/popularTransitRoutes.js';

dotenv.config();

const { Pool } = pg;

// Coordinate matching tolerance (in degrees, ~100 meters)
const COORD_TOLERANCE = 0.001;

function isPopularRoute(routeRow) {
    // Check against popular car/bike/walk routes
    if (routeRow.mode === 'car' || routeRow.mode === 'bike' || routeRow.mode === 'foot') {
        for (const popular of popularRoutes) {
            const originMatch = 
                Math.abs(routeRow.origin_lat - popular.originLat) < COORD_TOLERANCE &&
                Math.abs(routeRow.origin_lon - popular.originLon) < COORD_TOLERANCE;
            
            const destMatch = 
                Math.abs(routeRow.dest_lat - popular.destLat) < COORD_TOLERANCE &&
                Math.abs(routeRow.dest_lon - popular.destLon) < COORD_TOLERANCE;
            
            const modeMatch = routeRow.mode === popular.mode;
            
            if (originMatch && destMatch && modeMatch) {
                return true;
            }
        }
    }
    
    // Check against popular transit routes
    if (routeRow.mode === 'transit') {
        for (const popular of popularTransitRoutes) {
            const originMatch = 
                Math.abs(routeRow.origin_lat - popular.origin.lat) < COORD_TOLERANCE &&
                Math.abs(routeRow.origin_lon - popular.origin.lon) < COORD_TOLERANCE;
            
            const destMatch = 
                Math.abs(routeRow.dest_lat - popular.destination.lat) < COORD_TOLERANCE &&
                Math.abs(routeRow.dest_lon - popular.destination.lon) < COORD_TOLERANCE;
            
            if (originMatch && destMatch) {
                return true;
            }
        }
    }
    
    return false;
}

async function clearNonPopularCache() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    const client = await pool.connect();
    
    try {
        console.log('🔌 Connected to database');
        console.log(`📋 Popular routes configured: ${popularRoutes.length} car/bike/walk, ${popularTransitRoutes.length} transit`);
        console.log('');
        
        // Check if table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'route_cache'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('⚠️  route_cache table does not exist!');
            return;
        }

        // Get all routes from cache
        const allRoutes = await client.query(`
            SELECT id, origin_lat, origin_lon, dest_lat, dest_lon, mode, created_at
            FROM route_cache
            ORDER BY mode, created_at DESC
        `);
        
        console.log(`📊 Total routes in cache: ${allRoutes.rows.length}`);
        
        // Categorize routes
        const popularIds = [];
        const nonPopularIds = [];
        
        allRoutes.rows.forEach(route => {
            if (isPopularRoute(route)) {
                popularIds.push(route.id);
            } else {
                nonPopularIds.push(route.id);
            }
        });
        
        console.log(`✅ Popular routes to keep: ${popularIds.length}`);
        console.log(`🗑️  Non-popular routes to delete: ${nonPopularIds.length}`);
        console.log('');
        
        // Show breakdown by mode
        const popularByMode = {};
        const nonPopularByMode = {};
        
        allRoutes.rows.forEach(route => {
            const isPopular = popularIds.includes(route.id);
            const modeKey = route.mode;
            
            if (isPopular) {
                popularByMode[modeKey] = (popularByMode[modeKey] || 0) + 1;
            } else {
                nonPopularByMode[modeKey] = (nonPopularByMode[modeKey] || 0) + 1;
            }
        });
        
        console.log('📊 Breakdown:');
        console.log('   Routes to KEEP:');
        Object.entries(popularByMode).forEach(([mode, count]) => {
            console.log(`     - ${mode}: ${count} routes`);
        });
        
        console.log('   Routes to DELETE:');
        Object.entries(nonPopularByMode).forEach(([mode, count]) => {
            console.log(`     - ${mode}: ${count} routes`);
        });
        console.log('');
        
        if (nonPopularIds.length === 0) {
            console.log('✅ No non-popular routes to delete!');
            return;
        }
        
        // Delete non-popular routes
        console.log('🗑️  Deleting non-popular routes...');
        const deleteResult = await client.query(`
            DELETE FROM route_cache 
            WHERE id = ANY($1::bigint[])
        `, [nonPopularIds]);
        
        console.log(`✅ Deleted ${deleteResult.rowCount} routes`);
        console.log('');
        
        // Verify final state
        const finalCount = await client.query(`
            SELECT mode, COUNT(*) as count 
            FROM route_cache 
            GROUP BY mode
            ORDER BY mode
        `);
        
        console.log('📊 Final cache state:');
        finalCount.rows.forEach(row => {
            console.log(`   - ${row.mode}: ${row.count} routes`);
        });
        
        console.log('');
        console.log('✅ Cache cleaned! Popular routes preserved.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

clearNonPopularCache()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    });

