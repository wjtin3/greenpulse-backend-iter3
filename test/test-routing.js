import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TIMEOUT = 30000; // 30 seconds

/**
 * Test suite for Routing Service API
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
    console.log('\n=== Routing Service API Test Suite ===\n');
    console.log(`Testing API at: ${API_URL}\n`);

    // Test coordinates (KL City Center to KLCC)
    const origin = { latitude: 3.1390, longitude: 101.6869 };
    const destination = { latitude: 3.1570, longitude: 101.7120 };

    try {
        // Test 1: Health check
        console.log('1. Testing Health Check...');
        const healthResponse = await apiRequest('GET', '/api/routing/health');
        testResult(
            'Health check endpoint',
            healthResponse.status === 200 && healthResponse.data.success,
            healthResponse.status !== 200 ? `Status: ${healthResponse.status}` : ''
        );

        if (healthResponse.data.success) {
            console.log(`   Service: ${healthResponse.data.data.service}`);
            console.log(`   Status: ${healthResponse.data.data.status}`);
            console.log(`   Features: ${healthResponse.data.data.features.length}`);
        }
        console.log();

        // Test 2: Calculate distance
        console.log('2. Testing Calculate Distance...');
        const distanceResponse = await apiRequest('GET', 
            `/api/routing/distance?originLat=${origin.latitude}&originLon=${origin.longitude}&destLat=${destination.latitude}&destLon=${destination.longitude}`
        );
        testResult(
            'Calculate distance endpoint',
            distanceResponse.status === 200 && distanceResponse.data.success,
            distanceResponse.status !== 200 ? `Status: ${distanceResponse.status}` : ''
        );

        if (distanceResponse.data.success) {
            console.log(`   Distance: ${distanceResponse.data.data.distance.toFixed(2)} km`);
        }
        console.log();

        // Test 3: Calculate emissions for specific mode
        console.log('3. Testing Calculate Emissions...');
        const emissionsResponse = await apiRequest('POST', '/api/routing/emissions', {
            distance: 10.5,
            mode: 'car',
            size: 'medium',
            fuelType: 'petrol'
        });
        testResult(
            'Calculate emissions endpoint',
            emissionsResponse.status === 200 && emissionsResponse.data.success,
            emissionsResponse.status !== 200 ? `Status: ${emissionsResponse.status}` : ''
        );

        if (emissionsResponse.data.success) {
            console.log(`   Mode: ${emissionsResponse.data.data.mode}`);
            console.log(`   Total emissions: ${emissionsResponse.data.data.totalEmissions.toFixed(3)} kg CO2`);
        }
        console.log();

        // Test 4: Quick comparison
        console.log('4. Testing Quick Route Comparison...');
        const quickResponse = await apiRequest('POST', '/api/routing/compare/quick', {
            origin,
            destination
        });
        testResult(
            'Quick route comparison',
            quickResponse.status === 200 && quickResponse.data.success,
            quickResponse.status !== 200 ? `Status: ${quickResponse.status}` : ''
        );

        if (quickResponse.data.success) {
            const result = quickResponse.data.data;
            console.log(`   Route distance: ${result.routeDistance.toFixed(2)} km`);
            console.log(`   Total scenarios: ${result.totalScenarios}`);
            console.log(`   Best option: ${result.bestOption.name} (${result.bestOption.emissions.toFixed(3)} kg CO2)`);
            console.log(`   Worst option: ${result.worstOption.name} (${result.worstOption.emissions.toFixed(3)} kg CO2)`);
        }
        console.log();

        // Test 5: Full comparison
        console.log('5. Testing Full Route Comparison...');
        const fullResponse = await apiRequest('POST', '/api/routing/compare', {
            origin,
            destination,
            options: {
                vehicleSizes: ['medium'],
                fuelTypes: ['petrol', 'hybrid', 'bev'],
                excludePrivate: false,
                excludePublic: false,
                excludeActive: false
            }
        });
        testResult(
            'Full route comparison',
            fullResponse.status === 200 && fullResponse.data.success,
            fullResponse.status !== 200 ? `Status: ${fullResponse.status}` : ''
        );

        if (fullResponse.data.success) {
            const result = fullResponse.data.data;
            console.log(`   Route distance: ${result.routeDistance.toFixed(2)} km`);
            console.log(`   Total scenarios: ${result.totalScenarios}`);
            console.log(`   Best option: ${result.bestOption.name}`);
            console.log(`   Top 3 options:`);
            result.scenarios.slice(0, 3).forEach((s, i) => {
                console.log(`     ${i + 1}. ${s.name} - ${s.emissions.toFixed(3)} kg CO2`);
            });
        }
        console.log();

        // Test 6: Comparison with user ID (save to history)
        console.log('6. Testing Comparison with User ID...');
        const userCompareResponse = await apiRequest('POST', '/api/routing/compare/quick', {
            origin,
            destination,
            userId: 'test-user-123'
        });
        testResult(
            'Comparison with user ID',
            userCompareResponse.status === 200 && userCompareResponse.data.success,
            userCompareResponse.status !== 200 ? `Status: ${userCompareResponse.status}` : ''
        );

        if (userCompareResponse.data.success) {
            console.log(`   Comparison saved: ${userCompareResponse.data.data.savedId ? 'Yes' : 'No'}`);
        }
        console.log();

        // Test 7: Get route history
        console.log('7. Testing Get Route History...');
        const historyResponse = await apiRequest('GET', '/api/routing/history/test-user-123?limit=5');
        testResult(
            'Get route history',
            historyResponse.status === 200 && historyResponse.data.success,
            historyResponse.status !== 200 ? `Status: ${historyResponse.status}` : ''
        );

        if (historyResponse.data.success) {
            console.log(`   History count: ${historyResponse.data.data.count}`);
        }
        console.log();

        // Test 8: Get emission factors
        console.log('8. Testing Get Emission Factors...');
        const factorsResponse = await apiRequest('GET', '/api/routing/emission-factors');
        testResult(
            'Get emission factors',
            factorsResponse.status === 200 && factorsResponse.data.success,
            factorsResponse.status !== 200 ? `Status: ${factorsResponse.status}` : ''
        );

        if (factorsResponse.data.success) {
            const factors = factorsResponse.data.data.factors;
            const factorCount = Object.keys(factors).length;
            console.log(`   Total emission factors: ${factorCount}`);
            console.log(`   Sample factors:`);
            console.log(`     Car (small, petrol): ${factors.car_small_petrol} kg CO2/km`);
            console.log(`     Car (small, BEV): ${factors.car_small_bev} kg CO2/km`);
            console.log(`     Bus: ${factors.bus} kg CO2/km`);
            console.log(`     MRT: ${factors.mrt} kg CO2/km`);
        }
        console.log();

        // Test 9: Error handling - Missing parameters
        console.log('9. Testing Error Handling (Missing Parameters)...');
        const errorResponse1 = await apiRequest('POST', '/api/routing/compare', {
            origin: origin
            // Missing destination
        });
        testResult(
            'Missing parameters error handling',
            errorResponse1.status === 400,
            errorResponse1.status !== 400 ? `Expected 400, got ${errorResponse1.status}` : ''
        );
        console.log();

        // Test 10: Error handling - Invalid distance
        console.log('10. Testing Error Handling (Invalid Distance)...');
        const errorResponse2 = await apiRequest('POST', '/api/routing/emissions', {
            distance: -10,
            mode: 'car'
        });
        testResult(
            'Invalid distance error handling',
            errorResponse2.status === 400,
            errorResponse2.status !== 400 ? `Expected 400, got ${errorResponse2.status}` : ''
        );
        console.log();

        // Test 11: Different vehicle configurations
        console.log('11. Testing Different Vehicle Configurations...');
        const configTests = [
            { size: 'small', fuel: 'bev', expected: 0 },
            { size: 'medium', fuel: 'hybrid', expected: 0.121 },
            { size: 'large', fuel: 'petrol', expected: 0.282 }
        ];

        let configTestsPassed = 0;
        for (const config of configTests) {
            const response = await apiRequest('POST', '/api/routing/emissions', {
                distance: 1,
                mode: 'car',
                size: config.size,
                fuelType: config.fuel
            });

            if (response.data.success && Math.abs(response.data.data.totalEmissions - config.expected) < 0.001) {
                configTestsPassed++;
            }
        }

        testResult(
            'Different vehicle configurations',
            configTestsPassed === configTests.length,
            `Passed ${configTestsPassed}/${configTests.length} configuration tests`
        );
        console.log(`   Tested ${configTests.length} vehicle configurations`);
        console.log();

        // Test 12: Public transport modes
        console.log('12. Testing Public Transport Modes...');
        const publicModes = ['bus', 'mrt', 'lrt', 'train'];
        let publicTestsPassed = 0;

        for (const mode of publicModes) {
            const response = await apiRequest('POST', '/api/routing/emissions', {
                distance: 10,
                mode: mode
            });

            if (response.data.success && response.data.data.totalEmissions >= 0) {
                publicTestsPassed++;
            }
        }

        testResult(
            'Public transport modes',
            publicTestsPassed === publicModes.length,
            `Passed ${publicTestsPassed}/${publicModes.length} public transport tests`
        );
        console.log(`   Tested ${publicModes.length} public transport modes`);
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

