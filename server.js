import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { pool } from './config/database.js';
import carbonFootprintRoutes from './routes/carbonFootprint.js';
import cohereRoutes from './routes/cohere.js';
import groqRoutes from './routes/groq.js';
import recommendationRoutes from './routes/recommendations.js';
import gtfsRoutes from './routes/gtfs.js';
import routingRoutes from './routes/routing.js';
import GTFSRealtimeService from './services/gtfsRealtimeService.js';

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Some features may not work properly in production');
}

const app = express();
const PORT = process.env.API_PORT || 3001;

// Trust proxy for Vercel deployment (needed for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://maps.googleapis.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "https://maps.googleapis.com", "https://maps.gstatic.com"],
            connectSrc: ["'self'", "https://nominatim.openstreetmap.org", "https://unpkg.com", "https://maps.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["'self'", "blob:"],
          },
        },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://greenpulse-frontend-v.vercel.app', 'http://localhost:5173', 'http://localhost:3000'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Google Maps API Key endpoint
app.get('/api/config/maps-key', (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Google Maps API key not configured',
      message: 'Please set GOOGLE_MAPS_API_KEY in .env file'
    });
  }
  
  res.json({ 
    apiKey: apiKey,
    timestamp: new Date().toISOString()
  });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    const { testConnection } = await import('./config/database.js');
    const isConnected = await testConnection();
    res.json({ 
      status: isConnected ? 'OK' : 'ERROR',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api', carbonFootprintRoutes);
app.use('/api/cohere', cohereRoutes);
app.use('/api/groq', groqRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/gtfs', gtfsRoutes);
app.use('/api/routing', routingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export app for Vercel
export default app;

// Start server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize real-time vehicle tracking
    const gtfsRealtimeService = new GTFSRealtimeService();
    await gtfsRealtimeService.initializeRealtimeData();
    gtfsRealtimeService.startPeriodicRefresh();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    pool.end(() => {
      console.log('Database connection pool closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    pool.end(() => {
      console.log('Database connection pool closed');
      process.exit(0);
    });
  });
}
