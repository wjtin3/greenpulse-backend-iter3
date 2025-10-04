import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GTFS Service for Malaysia data.gov.my API
 * Handles fetching and processing GTFS data from Prasarana
 */
class GTFSService {
    constructor() {
        this.baseUrl = 'https://api.data.gov.my/gtfs-static';
        this.dataDir = path.join(__dirname, '..', 'data', 'gtfs');
        this.ensureDataDirectory();
    }

    /**
     * Ensure the GTFS data directory exists
     */
    ensureDataDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Get available Prasarana categories
     */
    getAvailableCategories() {
        return [
            'rapid-bus-mrtfeeder',  // Buses that bring passengers to MRT stations
            'rapid-rail-kl',        // KL rail services (LRT, MRT, Monorail)
            'rapid-bus-kl'          // KL bus services
        ];
    }

    /**
     * Download GTFS data for a specific category
     * @param {string} category - The Prasarana category
     * @returns {Promise<Object>} - Download result with file path and metadata
     */
    async downloadGTFSData(category) {
        try {
            // Validate category
            const availableCategories = this.getAvailableCategories();
            if (!availableCategories.includes(category)) {
                throw new Error(`Invalid category: ${category}. Available categories: ${availableCategories.join(', ')}`);
            }

            const url = `${this.baseUrl}/prasarana?category=${category}`;
            console.log(`Downloading GTFS data from: ${url}`);

            // Create category-specific directory
            const categoryDir = path.join(this.dataDir, category);
            if (!fs.existsSync(categoryDir)) {
                fs.mkdirSync(categoryDir, { recursive: true });
            }

            // Download the ZIP file
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const zipFileName = `${category}_${timestamp}.zip`;
            const zipFilePath = path.join(categoryDir, zipFileName);

            // Download and save the file
            const fileStream = createWriteStream(zipFilePath);
            await pipelineAsync(response.body, fileStream);

            // Get file size
            const stats = fs.statSync(zipFilePath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log(`Successfully downloaded ${category} GTFS data: ${zipFileName} (${fileSizeInMB} MB)`);

            return {
                success: true,
                category: category,
                fileName: zipFileName,
                filePath: zipFilePath,
                fileSize: stats.size,
                fileSizeMB: fileSizeInMB,
                downloadUrl: url,
                timestamp: new Date().toISOString(),
                description: this.getCategoryDescription(category)
            };

        } catch (error) {
            console.error(`Error downloading GTFS data for ${category}:`, error.message);
            return {
                success: false,
                category: category,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Download GTFS data for multiple categories
     * @param {Array<string>} categories - Array of categories to download
     * @returns {Promise<Array>} - Array of download results
     */
    async downloadMultipleCategories(categories) {
        const results = [];
        
        for (const category of categories) {
            console.log(`\n--- Downloading ${category} ---`);
            const result = await this.downloadGTFSData(category);
            results.push(result);
            
            // Add a small delay between downloads to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return results;
    }

    /**
     * Download all available Prasarana categories
     * @returns {Promise<Array>} - Array of download results
     */
    async downloadAllCategories() {
        const categories = this.getAvailableCategories();
        return await this.downloadMultipleCategories(categories);
    }

    /**
     * Get category description
     * @param {string} category - The category name
     * @returns {string} - Description of the category
     */
    getCategoryDescription(category) {
        const descriptions = {
            'rapid-bus-mrtfeeder': 'Buses that bring passengers to MRT stations (feeder services)',
            'rapid-rail-kl': 'KL rail services including LRT, MRT, and Monorail',
            'rapid-bus-kl': 'KL bus services operated by Prasarana'
        };
        return descriptions[category] || 'Unknown category';
    }

    /**
     * Get information about the GTFS API
     * @returns {Object} - API information
     */
    getAPIInfo() {
        return {
            name: 'Malaysia GTFS Static API',
            baseUrl: this.baseUrl,
            provider: 'data.gov.my',
            description: 'Official GTFS (General Transit Feed Specification) API for Malaysian public transport',
            availableAgencies: ['prasarana'],
            prasaranaCategories: this.getAvailableCategories(),
            updateFrequency: {
                'rapid-bus-mrtfeeder': 'As required',
                'rapid-rail-kl': 'As required', 
                'rapid-bus-kl': 'As required'
            },
            dataFormat: 'ZIP file containing GTFS text files',
            documentation: 'https://developer.data.gov.my/realtime-api/gtfs-static'
        };
    }

    /**
     * List downloaded GTFS files
     * @returns {Object} - List of downloaded files by category
     */
    listDownloadedFiles() {
        const files = {};
        
        if (!fs.existsSync(this.dataDir)) {
            return files;
        }

        const categories = this.getAvailableCategories();
        
        for (const category of categories) {
            const categoryDir = path.join(this.dataDir, category);
            if (fs.existsSync(categoryDir)) {
                const categoryFiles = fs.readdirSync(categoryDir)
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
                
                files[category] = categoryFiles;
            } else {
                files[category] = [];
            }
        }

        return files;
    }

    /**
     * Clean up old GTFS files (keep only the latest 3 files per category)
     * @returns {Object} - Cleanup results
     */
    cleanupOldFiles() {
        const results = {
            deleted: [],
            kept: [],
            errors: []
        };

        const files = this.listDownloadedFiles();
        
        for (const [category, categoryFiles] of Object.entries(files)) {
            if (categoryFiles.length > 3) {
                // Keep the 3 most recent files, delete the rest
                const filesToDelete = categoryFiles.slice(3);
                
                for (const file of filesToDelete) {
                    try {
                        fs.unlinkSync(file.filePath);
                        results.deleted.push({
                            category: category,
                            fileName: file.fileName,
                            sizeMB: file.sizeMB
                        });
                    } catch (error) {
                        results.errors.push({
                            category: category,
                            fileName: file.fileName,
                            error: error.message
                        });
                    }
                }
                
                // Add kept files to results
                const keptFiles = categoryFiles.slice(0, 3);
                results.kept.push({
                    category: category,
                    files: keptFiles.map(f => f.fileName)
                });
            } else {
                results.kept.push({
                    category: category,
                    files: categoryFiles.map(f => f.fileName)
                });
            }
        }

        return results;
    }
}

export default GTFSService;
