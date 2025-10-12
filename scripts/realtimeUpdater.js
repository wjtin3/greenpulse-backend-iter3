import GTFSRealtimeService from '../services/gtfsRealtimeService.js';

const gtfsService = new GTFSRealtimeService();

// Update every 30 seconds to match data.gov.my API frequency
const UPDATE_INTERVAL = 30000; // 30 seconds

console.log('🚀 GTFS Real-time Vehicle Position Updater');
console.log('📡 Data source: data.gov.my');
console.log(`⏱️  Update interval: ${UPDATE_INTERVAL / 1000} seconds\n`);

/**
 * Update vehicle positions from all providers
 */
async function updateVehiclePositions() {
    const startTime = Date.now();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Updating vehicle positions - ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(60));
    
    try {
        let totalVehicles = 0;
        const results = [];
        
        // Update Prasarana categories (buses)
        console.log('\n📍 Prasarana (Rapid Bus):');
        for (const category of ['rapid-bus-kl', 'rapid-bus-mrtfeeder']) {
            try {
                const result = await gtfsService.refreshVehiclePositions(category, true);
                if (result.success) {
                    const count = result.store.insertedCount;
                    totalVehicles += count;
                    console.log(`   ✅ ${category.padEnd(25)}: ${count} vehicles`);
                    results.push({ category, count, success: true });
                } else {
                    console.error(`   ❌ ${category.padEnd(25)}: ${result.error}`);
                    results.push({ category, success: false, error: result.error });
                }
            } catch (error) {
                console.error(`   ❌ ${category.padEnd(25)}: ${error.message}`);
                results.push({ category, success: false, error: error.message });
            }
        }
        
        // Update KTMB (trains)
        console.log('\n🚆 KTMB (Komuter & ETS):');
        try {
            const result = await gtfsService.refreshVehiclePositions('ktmb', true);
            if (result.success) {
                const count = result.store.insertedCount;
                totalVehicles += count;
                console.log(`   ✅ ktmb${' '.repeat(21)}: ${count} vehicles`);
                results.push({ category: 'ktmb', count, success: true });
            } else {
                console.error(`   ❌ ktmb${' '.repeat(21)}: ${result.error}`);
                results.push({ category: 'ktmb', success: false, error: result.error });
            }
        } catch (error) {
            console.error(`   ❌ ktmb${' '.repeat(21)}: ${error.message}`);
            results.push({ category: 'ktmb', success: false, error: error.message });
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log(`✅ Update completed in ${duration}s`);
        console.log(`📊 Total vehicles tracked: ${totalVehicles}`);
        console.log(`⏰ Next update in ${UPDATE_INTERVAL / 1000} seconds`);
        console.log('='.repeat(60));
        
        return {
            success: true,
            totalVehicles,
            duration: parseFloat(duration),
            results,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error('\n' + '='.repeat(60));
        console.error(`❌ Update failed after ${duration}s:`, error.message);
        console.error('='.repeat(60));
        
        return {
            success: false,
            error: error.message,
            duration: parseFloat(duration),
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Cleanup old records periodically (keep last 2 hours)
 */
async function cleanupOldRecords() {
    console.log('\n🧹 Cleaning up old vehicle position records...');
    
    try {
        const categories = ['rapid-bus-kl', 'rapid-bus-mrtfeeder', 'ktmb'];
        let totalDeleted = 0;
        
        for (const category of categories) {
            const result = await gtfsService.cleanupOldRecords(category, 2); // Keep last 2 hours
            if (result.success) {
                totalDeleted += result.deletedCount;
                console.log(`   ✅ ${category}: Deleted ${result.deletedCount} old records`);
            }
        }
        
        console.log(`✅ Cleanup completed: ${totalDeleted} records removed\n`);
    } catch (error) {
        console.error(`❌ Cleanup failed: ${error.message}\n`);
    }
}

/**
 * Main updater loop
 */
async function main() {
    console.log('🎯 Starting real-time vehicle position tracking...\n');
    
    // Initial update
    await updateVehiclePositions();
    
    // Schedule regular updates every 30 seconds
    setInterval(updateVehiclePositions, UPDATE_INTERVAL);
    
    // Cleanup old records every 30 minutes
    setInterval(cleanupOldRecords, 30 * 60 * 1000);
    
    console.log('\n✅ Real-time updater is now running');
    console.log('💡 Press Ctrl+C to stop');
    console.log('📊 Monitor logs above for updates\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down real-time updater...');
    console.log('✅ Goodbye!\n');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Shutting down real-time updater...');
    console.log('✅ Goodbye!\n');
    process.exit(0);
});

// Start the updater
main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});

