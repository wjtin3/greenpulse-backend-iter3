#!/usr/bin/env node

/**
 * GTFS Service Test Suite
 * Tests the GTFS service functionality for Malaysia data.gov.my API
 */

import GTFSService from '../services/gtfsService.js';

const BASE_URL = 'http://localhost:3001';

// Test configuration
const TEST_CONFIG = {
    timeout: 30000, // 30 seconds timeout for downloads
    testCategories: ['rapid-bus-mrtfeeder', 'rapid-rail-kl', 'rapid-bus-kl']
};

// Utility function to make HTTP requests
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        return { success: response.ok, status: response.status, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test functions
async function testGTFSServiceInfo() {
    console.log('\nTesting GTFS Service Info...');
    
    try {
        const gtfsService = new GTFSService();
        const apiInfo = gtfsService.getAPIInfo();
        
        console.log('GTFS Service Info:');
        console.log(`   Name: ${apiInfo.name}`);
        console.log(`   Base URL: ${apiInfo.baseUrl}`);
        console.log(`   Provider: ${apiInfo.provider}`);
        console.log(`   Available Categories: ${apiInfo.prasaranaCategories.length}`);
        
        // Validate expected categories
        const expectedCategories = ['rapid-bus-mrtfeeder', 'rapid-rail-kl', 'rapid-bus-kl'];
        const hasAllCategories = expectedCategories.every(cat => 
            apiInfo.prasaranaCategories.includes(cat)
        );
        
        if (hasAllCategories) {
            console.log('All expected categories are available');
        } else {
            console.log('Some expected categories are missing');
        }
        
        return true;
    } catch (error) {
        console.log(`GTFS Service Info test failed: ${error.message}`);
        return false;
    }
}

async function testAPIEndpoints() {
    console.log('\nTesting API Endpoints...');
    
    const endpoints = [
        { path: '/api/gtfs/info', name: 'GTFS Info' },
        { path: '/api/gtfs/categories', name: 'GTFS Categories' },
        { path: '/api/gtfs/health', name: 'GTFS Health' },
        { path: '/api/gtfs/files', name: 'GTFS Files' }
    ];
    
    let passed = 0;
    
    for (const endpoint of endpoints) {
        try {
            const result = await makeRequest(`${BASE_URL}${endpoint.path}`);
            
            if (result.success) {
                console.log(`PASS ${endpoint.name}: ${result.status}`);
                passed++;
            } else {
                console.log(`FAIL ${endpoint.name}: ${result.status || 'Error'} - ${result.error || result.data?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`FAIL ${endpoint.name}: ${error.message}`);
        }
    }
    
    console.log(`\nAPI Endpoints: ${passed}/${endpoints.length} passed`);
    return passed === endpoints.length;
}

async function testCategoryValidation() {
    console.log('\nTesting Category Validation...');
    
    try {
        // Test valid categories
        const validRequest = await makeRequest(`${BASE_URL}/api/gtfs/download`, {
            method: 'POST',
            body: JSON.stringify({
                categories: ['rapid-bus-mrtfeeder']
            })
        });
        
        if (validRequest.success) {
            console.log('Valid category request accepted');
        } else {
            console.log(`Valid category request rejected: ${validRequest.data?.error || 'Unknown error'}`);
        }
        
        // Test invalid categories
        const invalidRequest = await makeRequest(`${BASE_URL}/api/gtfs/download`, {
            method: 'POST',
            body: JSON.stringify({
                categories: ['invalid-category']
            })
        });
        
        if (!invalidRequest.success && invalidRequest.status === 400) {
            console.log('Invalid category request properly rejected');
        } else {
            console.log('Invalid category request not properly rejected');
        }
        
        return validRequest.success && !invalidRequest.success;
        
    } catch (error) {
        console.log(`Category validation test failed: ${error.message}`);
        return false;
    }
}

async function testFileManagement() {
    console.log('\nTesting File Management...');
    
    try {
        const gtfsService = new GTFSService();
        
        // Test list files
        const files = gtfsService.listDownloadedFiles();
        console.log(`File listing works: ${Object.keys(files).length} categories found`);
        
        // Test cleanup (dry run - we won't actually delete files in test)
        const cleanupResults = gtfsService.cleanupOldFiles();
        console.log(`Cleanup function works: ${cleanupResults.deleted.length} files would be deleted`);
        
        return true;
    } catch (error) {
        console.log(`File management test failed: ${error.message}`);
        return false;
    }
}

async function testDownloadFunctionality() {
    console.log('\nTesting Download Functionality (Single Category)...');
    
    try {
        const gtfsService = new GTFSService();
        
        // Test downloading a single category (rapid-bus-mrtfeeder)
        console.log('Testing download of rapid-bus-mrtfeeder...');
        const result = await gtfsService.downloadGTFSData('rapid-bus-mrtfeeder');
        
        if (result.success) {
            console.log('Download successful:');
            console.log(`   File: ${result.fileName}`);
            console.log(`   Size: ${result.fileSizeMB} MB`);
            console.log(`   Description: ${result.description}`);
            return true;
        } else {
            console.log(`Download failed: ${result.error}`);
            return false;
        }
        
    } catch (error) {
        console.log(`Download test failed: ${error.message}`);
        return false;
    }
}

async function testScriptExecution() {
    console.log('\nTesting Script Execution...');
    
    try {
        // Test script help
        const { spawn } = await import('child_process');
        
        return new Promise((resolve) => {
            const script = spawn('node', ['scripts/downloadGTFS.js', '--help'], {
                cwd: process.cwd(),
                stdio: 'pipe'
            });
            
            let output = '';
            script.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            script.on('close', (code) => {
                if (code === 0 && output.includes('GTFS Data Download Script')) {
                    console.log('Script help command works');
                    resolve(true);
                } else {
                    console.log('Script help command failed');
                    resolve(false);
                }
            });
            
            script.on('error', (error) => {
                console.log(`Script execution error: ${error.message}`);
                resolve(false);
            });
        });
        
    } catch (error) {
        console.log(`Script test failed: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('GTFS Service Test Suite');
    console.log('========================');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test Categories: ${TEST_CONFIG.testCategories.join(', ')}`);
    
    const tests = [
        { name: 'GTFS Service Info', fn: testGTFSServiceInfo },
        { name: 'API Endpoints', fn: testAPIEndpoints },
        { name: 'Category Validation', fn: testCategoryValidation },
        { name: 'File Management', fn: testFileManagement },
        { name: 'Download Functionality', fn: testDownloadFunctionality },
        { name: 'Script Execution', fn: testScriptExecution }
    ];
    
    let passed = 0;
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
            if (result) passed++;
        } catch (error) {
            console.log(`${test.name} test crashed: ${error.message}`);
            results.push({ name: test.name, passed: false });
        }
    }
    
    // Summary
    console.log('\nTest Results Summary:');
    console.log('====================');
    
    results.forEach(result => {
        const status = result.passed ? 'PASS' : 'FAIL';
        console.log(`${status} ${result.name}`);
    });
    
    console.log(`\nOverall: ${passed}/${tests.length} tests passed`);
    
    if (passed === tests.length) {
        console.log('All tests passed! GTFS service is working correctly.');
    } else {
        console.log('Some tests failed. Please check the output above.');
    }
    
    return passed === tests.length;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(error => {
        console.error('Test suite crashed:', error);
        process.exit(1);
    });
}

export { runTests };
