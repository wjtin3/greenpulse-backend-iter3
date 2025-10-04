# GTFS API Documentation

## Overview

The GTFS (General Transit Feed Specification) API provides access to Malaysian public transport data from the official [data.gov.my](https://developer.data.gov.my/realtime-api/gtfs-static) API. This service specifically focuses on Prasarana transport categories, including MRT feeder buses, KL rail services, and KL bus services.

## 🚌 Available Categories

### 1. rapid-bus-mrtfeeder
- **Description**: Buses that bring passengers to MRT stations (feeder services)
- **Purpose**: First-mile/last-mile connectivity to MRT stations
- **Update Frequency**: As required

### 2. rapid-rail-kl
- **Description**: KL rail services including LRT, MRT, and Monorail
- **Purpose**: Main rail transit services in Kuala Lumpur
- **Update Frequency**: As required

### 3. rapid-bus-kl
- **Description**: KL bus services operated by Prasarana
- **Purpose**: Bus services throughout Kuala Lumpur
- **Update Frequency**: As required (Note: ~2% of trips removed due to operational issues)

## 📡 API Endpoints

### Base URL
```
http://localhost:3001/api/gtfs
```

### 1. Get API Information
```http
GET /api/gtfs/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Malaysia GTFS Static API",
    "baseUrl": "https://api.data.gov.my/gtfs-static",
    "provider": "data.gov.my",
    "description": "Official GTFS API for Malaysian public transport",
    "availableAgencies": ["prasarana"],
    "prasaranaCategories": [
      "rapid-bus-mrtfeeder",
      "rapid-rail-kl", 
      "rapid-bus-kl"
    ],
    "updateFrequency": {
      "rapid-bus-mrtfeeder": "As required",
      "rapid-rail-kl": "As required",
      "rapid-bus-kl": "As required"
    },
    "dataFormat": "ZIP file containing GTFS text files",
    "documentation": "https://developer.data.gov.my/realtime-api/gtfs-static"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Get Available Categories
```http
GET /api/gtfs/categories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "rapid-bus-mrtfeeder",
        "description": "Buses that bring passengers to MRT stations (feeder services)"
      },
      {
        "category": "rapid-rail-kl",
        "description": "KL rail services including LRT, MRT, and Monorail"
      },
      {
        "category": "rapid-bus-kl",
        "description": "KL bus services operated by Prasarana"
      }
    ],
    "total": 3
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Download GTFS Data (Multiple Categories)
```http
POST /api/gtfs/download
Content-Type: application/json

{
  "categories": ["rapid-bus-mrtfeeder", "rapid-rail-kl", "rapid-bus-kl"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "success": true,
        "category": "rapid-bus-mrtfeeder",
        "fileName": "rapid-bus-mrtfeeder_2024-01-15T10-30-00-000Z.zip",
        "filePath": "/path/to/data/gtfs/rapid-bus-mrtfeeder/rapid-bus-mrtfeeder_2024-01-15T10-30-00-000Z.zip",
        "fileSize": 1048576,
        "fileSizeMB": "1.00",
        "downloadUrl": "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-bus-mrtfeeder",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "description": "Buses that bring passengers to MRT stations (feeder services)"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0,
      "categories": ["rapid-bus-mrtfeeder", "rapid-rail-kl", "rapid-bus-kl"]
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Download GTFS Data (Single Category)
```http
POST /api/gtfs/download/category/rapid-bus-mrtfeeder
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "category": "rapid-bus-mrtfeeder",
    "fileName": "rapid-bus-mrtfeeder_2024-01-15T10-30-00-000Z.zip",
    "filePath": "/path/to/data/gtfs/rapid-bus-mrtfeeder/rapid-bus-mrtfeeder_2024-01-15T10-30-00-000Z.zip",
    "fileSize": 1048576,
    "fileSizeMB": "1.00",
    "downloadUrl": "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-bus-mrtfeeder",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "description": "Buses that bring passengers to MRT stations (feeder services)"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 5. Download All Categories
```http
POST /api/gtfs/download/all
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      // Array of download results for all categories
    ],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0,
      "categories": ["rapid-bus-mrtfeeder", "rapid-rail-kl", "rapid-bus-kl"]
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 6. List Downloaded Files
```http
GET /api/gtfs/files
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": {
      "rapid-bus-mrtfeeder": [
        {
          "fileName": "rapid-bus-mrtfeeder_2024-01-15T10-30-00-000Z.zip",
          "filePath": "/path/to/data/gtfs/rapid-bus-mrtfeeder/rapid-bus-mrtfeeder_2024-01-15T10-30-00-000Z.zip",
          "size": 1048576,
          "sizeMB": "1.00",
          "lastModified": "2024-01-15T10:30:00.000Z"
        }
      ],
      "rapid-rail-kl": [],
      "rapid-bus-kl": []
    },
    "summary": {
      "totalFiles": 1,
      "totalSize": 1048576,
      "totalSizeMB": "1.00",
      "categories": ["rapid-bus-mrtfeeder", "rapid-rail-kl", "rapid-bus-kl"]
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 7. Clean Up Old Files
```http
DELETE /api/gtfs/cleanup
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": [
      {
        "category": "rapid-bus-mrtfeeder",
        "fileName": "old_file.zip",
        "sizeMB": "0.50"
      }
    ],
    "kept": [
      {
        "category": "rapid-bus-mrtfeeder",
        "files": ["recent_file1.zip", "recent_file2.zip", "recent_file3.zip"]
      }
    ],
    "errors": []
  },
  "message": "Cleanup completed. Deleted 1 files, kept 1 categories with recent files.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 8. Health Check
```http
GET /api/gtfs/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "service": "GTFS Service",
    "status": "healthy",
    "apiInfo": {
      "baseUrl": "https://api.data.gov.my/gtfs-static/prasarana",
      "availableCategories": 3
    },
    "downloadedFiles": {
      "totalCategories": 3,
      "totalFiles": 5
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🛠️ Command Line Script

### Usage
```bash
# Download all available categories
npm run download-gtfs

# Download specific categories
npm run download-gtfs -- --categories rapid-bus-mrtfeeder,rapid-rail-kl

# List downloaded files
npm run download-gtfs -- --list

# Clean up old files
npm run download-gtfs -- --cleanup

# Show help
npm run download-gtfs -- --help
```

### Script Options
- `-c, --categories <list>`: Comma-separated list of categories to download
- `-l, --list`: List currently downloaded files
- `--cleanup`: Clean up old files (keep only latest 3 per category)
- `-h, --help`: Show help message

## 📁 File Structure

Downloaded GTFS files are stored in the following structure:
```
data/
└── gtfs/
    ├── rapid-bus-mrtfeeder/
    │   ├── rapid-bus-mrtfeeder_2024-01-15T10-30-00-000Z.zip
    │   └── rapid-bus-mrtfeeder_2024-01-14T10-30-00-000Z.zip
    ├── rapid-rail-kl/
    │   └── rapid-rail-kl_2024-01-15T10-30-00-000Z.zip
    └── rapid-bus-kl/
        └── rapid-bus-kl_2024-01-15T10-30-00-000Z.zip
```

## 📊 GTFS Data Format

Each downloaded ZIP file contains the following GTFS text files:

| File | Description |
|------|-------------|
| `agency.txt` | Information about transit agencies |
| `stops.txt` | Information about transit stops |
| `routes.txt` | Details about transit routes |
| `trips.txt` | Specific trips with associated route information |
| `stop_times.txt` | Timetables and stop details for trips |
| `calendar.txt` | Service availability for specific dates |

Optional files (if available):
- `frequencies.txt` - Frequency-based service
- `shapes.txt` - Route shapes and geometry

## 🧪 Testing

### Run GTFS Tests
```bash
node test/test-gtfs.js
```

### Test Individual Components
```bash
# Test API endpoints
curl http://localhost:3001/api/gtfs/health

# Test category validation
curl -X POST http://localhost:3001/api/gtfs/download \
  -H "Content-Type: application/json" \
  -d '{"categories": ["rapid-bus-mrtfeeder"]}'

# Test file listing
curl http://localhost:3001/api/gtfs/files
```

## 🔧 Integration Examples

### JavaScript/Node.js
```javascript
// Download GTFS data
const response = await fetch('http://localhost:3001/api/gtfs/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    categories: ['rapid-bus-mrtfeeder', 'rapid-rail-kl']
  })
});

const result = await response.json();
console.log('Download results:', result.data.results);
```

### Python
```python
import requests

# Download GTFS data
response = requests.post('http://localhost:3001/api/gtfs/download', 
  json={'categories': ['rapid-bus-mrtfeeder', 'rapid-rail-kl']})

result = response.json()
print('Download results:', result['data']['results'])
```

### cURL
```bash
# Download specific categories
curl -X POST http://localhost:3001/api/gtfs/download \
  -H "Content-Type: application/json" \
  -d '{"categories": ["rapid-bus-mrtfeeder", "rapid-rail-kl", "rapid-bus-kl"]}'

# List downloaded files
curl http://localhost:3001/api/gtfs/files

# Clean up old files
curl -X DELETE http://localhost:3001/api/gtfs/cleanup
```

## 🚨 Error Handling

### Common Error Responses

#### Invalid Category
```json
{
  "success": false,
  "error": "Invalid categories",
  "message": "Invalid categories: invalid-category. Available categories: rapid-bus-mrtfeeder, rapid-rail-kl, rapid-bus-kl"
}
```

#### Download Failure
```json
{
  "success": false,
  "category": "rapid-bus-mrtfeeder",
  "error": "HTTP error! status: 404 - Not Found",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Service Error
```json
{
  "success": false,
  "error": "Failed to download GTFS data",
  "message": "Network timeout"
}
```

## 📚 Additional Resources

- [GTFS Specification](https://developers.google.com/transit/gtfs)
- [Malaysia data.gov.my GTFS API](https://developer.data.gov.my/realtime-api/gtfs-static)
- [Prasarana Malaysia](https://www.myrapid.com.my/)
- [GTFS Best Practices](https://gtfs.org/best-practices/)

## 🔄 Update Frequency

- **rapid-bus-mrtfeeder**: As required
- **rapid-rail-kl**: As required  
- **rapid-bus-kl**: As required (Note: ~2% of trips removed due to operational issues)

## 💡 Best Practices

1. **Regular Updates**: Download fresh data regularly to ensure accuracy
2. **File Management**: Use the cleanup endpoint to manage storage space
3. **Error Handling**: Always check the `success` field in responses
4. **Rate Limiting**: Be respectful of the API - the service includes delays between downloads
5. **Storage**: Monitor disk space as GTFS files can be large
6. **Validation**: Validate downloaded files before processing

## 🆘 Troubleshooting

### Common Issues

1. **Download Failures**
   - Check internet connectivity
   - Verify API endpoint availability
   - Check for rate limiting

2. **File Access Issues**
   - Ensure proper file permissions
   - Check disk space availability
   - Verify directory structure

3. **API Errors**
   - Check server logs
   - Verify environment configuration
   - Test with health endpoint

### Getting Help

- Check the [Complete Setup Guide](COMPLETE_SETUP_GUIDE.md)
- Run the test suite: `node test/test-gtfs.js`
- Review server logs for detailed error messages
- Check the [Malaysia data.gov.my documentation](https://developer.data.gov.my/realtime-api/gtfs-static)
