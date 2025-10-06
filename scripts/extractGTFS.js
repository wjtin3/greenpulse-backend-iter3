#!/usr/bin/env node

/**
 * GTFS Data Extraction Script
 * Extracts and parses GTFS ZIP files from downloaded data
 * 
 * Usage:
 *   node scripts/extractGTFS.js [options]
 *   node scripts/extractGTFS.js --category rapid-bus-mrtfeeder
 *   node scripts/extractGTFS.js --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import AdmZip from 'adm-zip';

const pipelineAsync = promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GTFSExtractor {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data', 'gtfs');
        this.extractedDir = path.join(__dirname, '..', 'data', 'gtfs', 'extracted');
        this.parsedDir = path.join(__dirname, '..', 'data', 'gtfs', 'parsed');
        this.ensureDirectories();
    }

    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        [this.extractedDir, this.parsedDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Get available categories
     */
    getAvailableCategories() {
        return ['rapid-bus-mrtfeeder', 'rapid-rail-kl', 'rapid-bus-kl'];
    }

    /**
     * List available ZIP files for a category
     */
    listZipFiles(category) {
        const categoryDir = path.join(this.dataDir, category);
        if (!fs.existsSync(categoryDir)) {
            return [];
        }

        return fs.readdirSync(categoryDir)
            .filter(file => file.endsWith('.zip'))
            .map(file => {
                const filePath = path.join(categoryDir, file);
                const stats = fs.statSync(filePath);
                return {
                    fileName: file,
                    filePath: filePath,
                    size: stats.size,
                    sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
                    lastModified: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    }

    /**
     * Extract ZIP file
     */
    async extractZipFile(zipFilePath, category) {
        try {
            const zip = new AdmZip(zipFilePath);
            const extractPath = path.join(this.extractedDir, category);
            
            // Create category directory
            if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true });
            }

            // Extract all files
            zip.extractAllTo(extractPath, true);
            
            // List extracted files
            const extractedFiles = fs.readdirSync(extractPath)
                .filter(file => file.endsWith('.txt'))
                .map(file => {
                    const filePath = path.join(extractPath, file);
                    const stats = fs.statSync(filePath);
                    return {
                        fileName: file,
                        filePath: filePath,
                        size: stats.size,
                        sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
                    };
                });

            console.log(`Extracted ${extractedFiles.length} files from ${path.basename(zipFilePath)}`);
            extractedFiles.forEach(file => {
                console.log(`   ${file.fileName}: ${file.sizeMB} MB`);
            });

            return {
                success: true,
                category: category,
                zipFile: path.basename(zipFilePath),
                extractedFiles: extractedFiles,
                extractPath: extractPath
            };

        } catch (error) {
            console.error(`Error extracting ${zipFilePath}:`, error.message);
            return {
                success: false,
                category: category,
                zipFile: path.basename(zipFilePath),
                error: error.message
            };
        }
    }

    /**
     * Parse CSV file and return structured data
     */
    parseCSVFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                return { headers: [], rows: [] };
            }

            // Parse headers
            const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
            
            // Parse data rows
            const rows = lines.slice(1).map(line => {
                const values = this.parseCSVLine(line);
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                return row;
            });

            return {
                headers: headers,
                rows: rows,
                totalRows: rows.length
            };

        } catch (error) {
            console.error(`Error parsing CSV file ${filePath}:`, error.message);
            return {
                headers: [],
                rows: [],
                error: error.message
            };
        }
    }

    /**
     * Parse a single CSV line handling quoted values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }

    /**
     * Process all GTFS files for a category
     */
    async processCategory(category) {
        console.log(`\nProcessing category: ${category}`);
        console.log('='.repeat(50));

        const zipFiles = this.listZipFiles(category);
        if (zipFiles.length === 0) {
            console.log(`No ZIP files found for category: ${category}`);
            return { success: false, error: 'No ZIP files found' };
        }

        // Use the most recent ZIP file
        const latestZip = zipFiles[0];
        console.log(`Using latest ZIP file: ${latestZip.fileName} (${latestZip.sizeMB} MB)`);

        // Extract the ZIP file
        const extractResult = await this.extractZipFile(latestZip.filePath, category);
        if (!extractResult.success) {
            return extractResult;
        }

        // Parse all extracted files
        const parseResults = {};
        const gtfsFiles = ['agency', 'routes', 'stops', 'calendar', 'calendar_dates', 'trips', 'stop_times', 'shapes'];
        
        for (const gtfsFile of gtfsFiles) {
            const filePath = path.join(extractResult.extractPath, `${gtfsFile}.txt`);
            if (fs.existsSync(filePath)) {
                console.log(`\nParsing ${gtfsFile}.txt...`);
                const parseResult = this.parseCSVFile(filePath);
                parseResults[gtfsFile] = parseResult;
                
                if (parseResult.error) {
                    console.log(`   Error: ${parseResult.error}`);
                } else {
                    console.log(`   Headers: ${parseResult.headers.length}`);
                    console.log(`   Rows: ${parseResult.totalRows}`);
                }
            } else {
                console.log(`\nFile not found: ${gtfsFile}.txt`);
                parseResults[gtfsFile] = { headers: [], rows: [], error: 'File not found' };
            }
        }

        // Save parsed data as JSON
        const parsedDataPath = path.join(this.parsedDir, `${category}_parsed.json`);
        const parsedData = {
            category: category,
            sourceZip: latestZip.fileName,
            extractedAt: new Date().toISOString(),
            files: parseResults
        };

        fs.writeFileSync(parsedDataPath, JSON.stringify(parsedData, null, 2));
        console.log(`\nParsed data saved to: ${parsedDataPath}`);

        return {
            success: true,
            category: category,
            sourceZip: latestZip.fileName,
            parsedData: parsedData,
            parsedDataPath: parsedDataPath
        };
    }

    /**
     * Process all categories
     */
    async processAllCategories() {
        const categories = this.getAvailableCategories();
        const results = [];

        for (const category of categories) {
            const result = await this.processCategory(category);
            results.push(result);
        }

        return results;
    }

    /**
     * Get summary of processed data
     */
    getProcessingSummary(results) {
        const summary = {
            totalCategories: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            categories: {}
        };

        results.forEach(result => {
            if (result.success && result.parsedData) {
                summary.categories[result.category] = {
                    sourceZip: result.sourceZip,
                    files: Object.keys(result.parsedData.files).reduce((acc, fileName) => {
                        const fileData = result.parsedData.files[fileName];
                        acc[fileName] = {
                            hasData: !fileData.error,
                            rowCount: fileData.totalRows || 0,
                            headers: fileData.headers?.length || 0
                        };
                        return acc;
                    }, {})
                };
            }
        });

        return summary;
    }
}

// Command line interface
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        category: null,
        all: false,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--category':
            case '-c':
                if (i + 1 < args.length) {
                    options.category = args[i + 1];
                    i++;
                }
                break;
            case '--all':
            case '-a':
                options.all = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    }

    return options;
}

function showHelp() {
    console.log(`
GTFS Data Extraction Script
===========================

Extracts and parses GTFS ZIP files from downloaded data.

Usage:
  node scripts/extractGTFS.js [options]

Options:
  -c, --category <name>    Extract and parse specific category
  -a, --all               Extract and parse all categories
  -h, --help              Show this help message

Available Categories:
  rapid-bus-mrtfeeder      Buses that bring passengers to MRT stations
  rapid-rail-kl            KL rail services (LRT, MRT, Monorail)
  rapid-bus-kl             KL bus services

Examples:
  # Extract and parse all categories
  node scripts/extractGTFS.js --all

  # Extract and parse specific category
  node scripts/extractGTFS.js --category rapid-bus-mrtfeeder

Output:
  - Extracted files: data/gtfs/extracted/<category>/
  - Parsed JSON: data/gtfs/parsed/<category>_parsed.json
`);
}

// Main execution
async function main() {
    const options = parseArgs();
    
    if (options.help) {
        showHelp();
        return;
    }

    const extractor = new GTFSExtractor();

    try {
        console.log('GTFS Data Extraction Script');
        console.log('============================\n');

        let results;
        
        if (options.category) {
            // Validate category
            const availableCategories = extractor.getAvailableCategories();
            if (!availableCategories.includes(options.category)) {
                console.error(`Invalid category: ${options.category}`);
                console.error(`Available categories: ${availableCategories.join(', ')}`);
                process.exit(1);
            }
            
            results = [await extractor.processCategory(options.category)];
        } else if (options.all) {
            results = await extractor.processAllCategories();
        } else {
            console.log('Please specify --category <name> or --all');
            console.log('Use --help for more information');
            return;
        }

        // Display summary
        console.log('\nProcessing Summary:');
        console.log('===================');
        
        const summary = extractor.getProcessingSummary(results);
        console.log(`Total categories: ${summary.totalCategories}`);
        console.log(`Successful: ${summary.successful}`);
        console.log(`Failed: ${summary.failed}`);

        if (summary.successful > 0) {
            console.log('\nProcessed categories:');
            Object.entries(summary.categories).forEach(([category, data]) => {
                console.log(`\n${category}:`);
                console.log(`   Source: ${data.sourceZip}`);
                Object.entries(data.files).forEach(([fileName, fileData]) => {
                    const status = fileData.hasData ? '✓' : '✗';
                    console.log(`   ${status} ${fileName}: ${fileData.rowCount} rows, ${fileData.headers} headers`);
                });
            });
        }

        if (summary.failed > 0) {
            console.log('\nFailed categories:');
            results.filter(r => !r.success).forEach(result => {
                console.log(`   ${result.category}: ${result.error}`);
            });
        }

    } catch (error) {
        console.error('Script execution failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

export default GTFSExtractor;
