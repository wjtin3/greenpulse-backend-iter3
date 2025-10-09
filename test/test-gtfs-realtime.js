import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TIMEOUT = 30000; // 30 seconds

/**
 * Test suite for GTFS Realtime API
 */

// Helper function to make API requests
async function apiRequest(method, endpoint, body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        console.error(`Error making ${method} request to ${endpoint}:`, error.message);
        throw error;
    }
}

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function testResult(testName, passed, message = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        console.log(`[PASS] ${testName}`);
    } else {
        failedTests++;
        console.log(`[FAIL] ${testName}`);
        if (message) console.log(`  ${message}`);
    }
}

// Run tests
async function runTests() {
    console.log('\n=== GTFS Realtime API Test Suite ===\n');
    console.log(`Testing API at: ${API_URL}\n`);

    try {
        // Test 1: Health check
        console.log('1. Testing Health Check...');
        const healthResponse = await apiRequest('GET', '/api/gtfs/realtime/health');
        testResult(
            'Health check endpoint',
            healthResponse.status === 200 && healthResponse.data.success,
            healthResponse.status !== 200 ? `Status: ${healthResponse.status}` : ''
        );

        if (healthResponse.data.success) {
            console.log(`   Service: ${healthResponse.data.data.service}`);
            console.log(`   Status: ${healthResponse.data.data.status}`);
            console.log(`   Available Categories: ${healthResponse.data.data.availableCategories.join(', ')}`);
        }
        console.log();

        // Test 2: Get available categories
        console.log('2. Testing Get Categories...');
        const categoriesResponse = await apiRequest('GET', '/api/gtfs/realtime/categories');
        testResult(
            'Get categories endpoint',
            categoriesResponse.status === 200 && categoriesResponse.data.success,
            categoriesResponse.status !== 200 ? `Status: ${categoriesResponse.status}` : ''
        );

        if (categoriesResponse.data.success) {
            console.log(`   Categories: ${categoriesResponse.data.data.categories.join(', ')}`);
            console.log(`   Total: ${categoriesResponse.data.data.total}`);
        }
        console.log();

        // Test 3: Refresh single category (rapid-bus-kl)
        console.log('3. Testing Refresh Single Category (rapid-bus-kl)...');
        const refreshResponse = await apiRequest('POST', '/api/gtfs/realtime/refresh/rapid-bus-kl', {
            clearOld: true
        });
        testResult(
            'Refresh single category',
            refreshResponse.status === 200 && refreshResponse.data.success,
            refreshResponse.status !== 200 ? `Status: ${refreshResponse.status}` : ''
        );

        if (refreshResponse.data.success) {
            const result = refreshResponse.data.data;
            console.log(`   Category: ${result.category}`);
            console.log(`   Fetched: ${result.fetch.count} vehicles`);
            console.log(`   Stored: ${result.store.insertedCount} records`);
            console.log(`   Deleted: ${result.store.deletedCount} old records`);
        }
        console.log();

        // Test 4: Refresh all categories
        console.log('4. Testing Refresh All Categories...');
        const refreshAllResponse = await apiRequest('POST', '/api/gtfs/realtime/refresh/all', {
            clearOld: true
        });
        testResult(
            'Refresh all categories',
            refreshAllResponse.status === 200 && refreshAllResponse.data.success,
            refreshAllResponse.status !== 200 ? `Status: ${refreshAllResponse.status}` : ''
        );

        if (refreshAllResponse.data.success) {
            const summary = refreshAllResponse.data.data.summary;
            console.log(`   Total: ${summary.total}`);
            console.log(`   Successful: ${summary.successful}`);
            console.log(`   Failed: ${summary.failed}`);
            
            refreshAllResponse.data.data.results.forEach(result => {
                if (result.success) {
                    console.log(`   - ${result.category}: ${result.store.insertedCount} vehicles inserted`);
                }
            });
        }
        console.log();

        // Wait a moment for data to be fully committed
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 5: Get latest vehicles for a category
        console.log('5. Testing Get Latest Vehicles (rapid-bus-kl)...');
        const vehiclesResponse = await apiRequest('GET', '/api/gtfs/realtime/vehicles/rapid-bus-kl?minutesOld=10');
        testResult(
            'Get latest vehicles',
            vehiclesResponse.status === 200 && vehiclesResponse.data.success,
            vehiclesResponse.status !== 200 ? `Status: ${vehiclesResponse.status}` : ''
        );

        if (vehiclesResponse.data.success) {
            console.log(`   Category: ${vehiclesResponse.data.data.category}`);
            console.log(`   Vehicle count: ${vehiclesResponse.data.data.count}`);
            
            if (vehiclesResponse.data.data.vehicles.length > 0) {
                const firstVehicle = vehiclesResponse.data.data.vehicles[0];
                console.log(`   Sample vehicle:`);
                console.log(`     ID: ${firstVehicle.vehicle_id}`);
                console.log(`     Location: ${firstVehicle.latitude}, ${firstVehicle.longitude}`);
                console.log(`     Speed: ${firstVehicle.speed || 'N/A'}`);
            }
        }
        console.log();

        // Test 6: Get all current vehicles
        console.log('6. Testing Get All Current Vehicles...');
        const allVehiclesResponse = await apiRequest('GET', '/api/gtfs/realtime/vehicles');
        testResult(
            'Get all current vehicles',
            allVehiclesResponse.status === 200 && allVehiclesResponse.data.success,
            allVehiclesResponse.status !== 200 ? `Status: ${allVehiclesResponse.status}` : ''
        );

        if (allVehiclesResponse.data.success) {
            console.log(`   Total vehicles: ${allVehiclesResponse.data.data.totalCount}`);
            const byCategory = allVehiclesResponse.data.data.byCategory;
            Object.keys(byCategory).forEach(category => {
                console.log(`   - ${category}: ${byCategory[category].length} vehicles`);
            });
        }
        console.log();

        // Test 7: Get nearby vehicles (KL city center: 3.1390, 101.6869)
        console.log('7. Testing Get Nearby Vehicles...');
        const nearbyResponse = await apiRequest(
            'GET', 
            '/api/gtfs/realtime/vehicles/nearby/rapid-bus-kl?lat=3.1390&lon=101.6869&radius=5&minutesOld=10'
        );
        testResult(
            'Get nearby vehicles',
            nearbyResponse.status === 200 && nearbyResponse.data.success,
            nearbyResponse.status !== 200 ? `Status: ${nearbyResponse.status}` : ''
        );

        if (nearbyResponse.data.success) {
            console.log(`   Location: ${nearbyResponse.data.data.location.latitude}, ${nearbyResponse.data.data.location.longitude}`);
            console.log(`   Radius: ${nearbyResponse.data.data.radiusKm} km`);
            console.log(`   Vehicles found: ${nearbyResponse.data.data.count}`);
            
            if (nearbyResponse.data.data.vehicles.length > 0) {
                const nearest = nearbyResponse.data.data.vehicles[0];
                console.log(`   Nearest vehicle: ${nearest.vehicle_id} (${nearest.distance_km} km away)`);
            }
        }
        console.log();

        // Test 8: Cleanup old records (keep last 24 hours)
        console.log('8. Testing Cleanup Old Records...');
        const cleanupResponse = await apiRequest(
            'DELETE', 
            '/api/gtfs/realtime/cleanup/rapid-bus-kl?hoursToKeep=24'
        );
        testResult(
            'Cleanup old records',
            cleanupResponse.status === 200 && cleanupResponse.data.success,
            cleanupResponse.status !== 200 ? `Status: ${cleanupResponse.status}` : ''
        );

        if (cleanupResponse.data.success) {
            console.log(`   Category: ${cleanupResponse.data.data.category}`);
            console.log(`   Deleted: ${cleanupResponse.data.data.deletedCount} records`);
            console.log(`   Kept: Last ${cleanupResponse.data.data.hoursKept} hours`);
        }
        console.log();

        // Test 9: Invalid category test
        console.log('9. Testing Error Handling (Invalid Category)...');
        const invalidResponse = await apiRequest('POST', '/api/gtfs/realtime/refresh/invalid-category');
        testResult(
            'Invalid category error handling',
            invalidResponse.status === 400,
            invalidResponse.status !== 400 ? `Expected 400, got ${invalidResponse.status}` : ''
        );
        console.log();

        // Test 10: Missing parameters test
        console.log('10. Testing Error Handling (Missing Parameters)...');
        const missingParamsResponse = await apiRequest(
            'GET', 
            '/api/gtfs/realtime/vehicles/nearby/rapid-bus-kl?lat=3.1390'
        );
        testResult(
            'Missing parameters error handling',
            missingParamsResponse.status === 400,
            missingParamsResponse.status !== 400 ? `Expected 400, got ${missingParamsResponse.status}` : ''
        );
        console.log();

    } catch (error) {
        console.error('\n[ERROR] Test suite failed with error:', error.message);
        console.error(error);
    }

    // Print summary
    console.log('\n=== Test Summary ===');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} [PASS]`);
    console.log(`Failed: ${failedTests} [FAIL]`);
    console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

    if (failedTests === 0) {
        console.log('SUCCESS: All tests passed!\n');
        process.exit(0);
    } else {
        console.log('WARNING: Some tests failed. Please review the output above.\n');
        process.exit(1);
    }
}

// Run the test suite
runTests().catch(error => {
    console.error('Fatal error running test suite:', error);
    process.exit(1);
});

