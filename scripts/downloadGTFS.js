#!/usr/bin/env node

/**
 * GTFS Data Download Script
 * Downloads GTFS data from Malaysia data.gov.my API for Prasarana categories
 * 
 * Usage:
 *   node scripts/downloadGTFS.js                    # Download all categories
 *   node scripts/downloadGTFS.js --categories rapid-bus-mrtfeeder,rapid-rail-kl
 *   node scripts/downloadGTFS.js --help
 */

import GTFSService from '../services/gtfsService.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        categories: null,
        help: false,
        cleanup: false,
        list: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--categories':
            case '-c':
                if (i + 1 < args.length) {
                    options.categories = args[i + 1].split(',').map(cat => cat.trim());
                    i++; // Skip next argument as it's the value
                }
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            case '--cleanup':
                options.cleanup = true;
                break;
            case '--list':
            case '-l':
                options.list = true;
                break;
        }
    }

    return options;
}

// Display help information
function showHelp() {
    console.log(`
GTFS Data Download Script
=========================

Downloads GTFS (General Transit Feed Specification) data from Malaysia data.gov.my API
for Prasarana public transport categories.

Usage:
  node scripts/downloadGTFS.js [options]

Options:
  -c, --categories <list>    Comma-separated list of categories to download
  -l, --list                 List currently downloaded files
  --cleanup                  Clean up old files (keep only latest 3 per category)
  -h, --help                 Show this help message

Available Categories:
  rapid-bus-mrtfeeder        Buses that bring passengers to MRT stations
  rapid-rail-kl              KL rail services (LRT, MRT, Monorail)
  rapid-bus-kl               KL bus services

Examples:
  # Download all available categories
  node scripts/downloadGTFS.js

  # Download specific categories
  node scripts/downloadGTFS.js --categories rapid-bus-mrtfeeder,rapid-rail-kl

  # List downloaded files
  node scripts/downloadGTFS.js --list

  # Clean up old files
  node scripts/downloadGTFS.js --cleanup

API Information:
  Base URL: https://api.data.gov.my/gtfs-static/prasarana
  Documentation: https://developer.data.gov.my/realtime-api/gtfs-static
  Data Format: ZIP files containing GTFS text files
`);
}

// Main execution function
async function main() {
    const options = parseArgs();
    
    if (options.help) {
        showHelp();
        return;
    }

    const gtfsService = new GTFSService();

    try {
        // Show API information
        console.log('GTFS Data Download Script');
        console.log('==========================\n');
        
        const apiInfo = gtfsService.getAPIInfo();
        console.log(`API Provider: ${apiInfo.provider}`);
        console.log(`Base URL: ${apiInfo.baseUrl}`);
        console.log(`Available Categories: ${apiInfo.prasaranaCategories.join(', ')}\n`);

        // Handle list command
        if (options.list) {
            console.log('Currently Downloaded Files:');
            console.log('===========================\n');
            
            const files = gtfsService.listDownloadedFiles();
            
            if (Object.keys(files).length === 0) {
                console.log('No files downloaded yet.');
                return;
            }

            for (const [category, categoryFiles] of Object.entries(files)) {
                console.log(`Category: ${category}`);
                console.log(`   Description: ${gtfsService.getCategoryDescription(category)}`);
                
                if (categoryFiles.length === 0) {
                    console.log('   No files downloaded\n');
                } else {
                    categoryFiles.forEach(file => {
                        console.log(`   File: ${file.fileName}`);
                        console.log(`      Size: ${file.sizeMB} MB`);
                        console.log(`      Modified: ${new Date(file.lastModified).toLocaleString()}`);
                    });
                    console.log('');
                }
            }
            return;
        }

        // Handle cleanup command
        if (options.cleanup) {
            console.log('Cleaning up old GTFS files...\n');
            
            const cleanupResults = gtfsService.cleanupOldFiles();
            
            console.log(`Cleanup completed:`);
            console.log(`   Deleted: ${cleanupResults.deleted.length} files`);
            console.log(`   Kept: ${cleanupResults.kept.length} categories with recent files`);
            
            if (cleanupResults.deleted.length > 0) {
                console.log('\nDeleted files:');
                cleanupResults.deleted.forEach(file => {
                    console.log(`   - ${file.category}/${file.fileName} (${file.sizeMB} MB)`);
                });
            }
            
            if (cleanupResults.errors.length > 0) {
                console.log('\nErrors during cleanup:');
                cleanupResults.errors.forEach(error => {
                    console.log(`   - ${error.category}/${error.fileName}: ${error.error}`);
                });
            }
            return;
        }

        // Determine categories to download
        let categoriesToDownload;
        
        if (options.categories) {
            // Validate provided categories
            const availableCategories = gtfsService.getAvailableCategories();
            const invalidCategories = options.categories.filter(cat => !availableCategories.includes(cat));
            
            if (invalidCategories.length > 0) {
                console.error(`Invalid categories: ${invalidCategories.join(', ')}`);
                console.error(`Available categories: ${availableCategories.join(', ')}`);
                process.exit(1);
            }
            
            categoriesToDownload = options.categories;
        } else {
            categoriesToDownload = gtfsService.getAvailableCategories();
        }

        console.log(`Downloading GTFS data for categories: ${categoriesToDownload.join(', ')}\n`);

        // Download the data
        const results = await gtfsService.downloadMultipleCategories(categoriesToDownload);

        // Display results
        console.log('\nDownload Results:');
        console.log('=================\n');

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`Successful downloads: ${successful.length}`);
        successful.forEach(result => {
            console.log(`   ${result.category}: ${result.fileName} (${result.fileSizeMB} MB)`);
            console.log(`      Description: ${result.description}`);
        });

        if (failed.length > 0) {
            console.log(`\nFailed downloads: ${failed.length}`);
            failed.forEach(result => {
                console.log(`   ${result.category}: ${result.error}`);
            });
        }

        console.log(`\nFiles saved to: ${gtfsService.dataDir}`);
        console.log(`\nUse 'node scripts/downloadGTFS.js --list' to view downloaded files`);
        console.log(`Use 'node scripts/downloadGTFS.js --cleanup' to clean up old files`);

    } catch (error) {
        console.error('Script execution failed:', error.message);
        process.exit(1);
    }
}

// Run the script
main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
