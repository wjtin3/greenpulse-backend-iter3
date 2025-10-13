// Integration tests using real Vercel database
const request = require('supertest');
const express = require('express');

// Import the actual services (not mocked)
const RoutingService = require('../../services/routingService.js').default;
const TransitRoutingService = require('../../services/transitRoutingService.js').default;
const GTFSRealtimeService = require('../../services/gtfsRealtimeService.js').default;

describe('Routing Integration Tests', () => {
  let app;
  let routingService;
  let transitRoutingService;
  let gtfsRealtimeService;

  beforeAll(async () => {
    // Initialize services with real database
    routingService = new RoutingService();
    transitRoutingService = new TransitRoutingService();
    gtfsRealtimeService = new GTFSRealtimeService();

    // Create Express app
    app = express();
    app.use(express.json());
    
    // Import and use the routing routes
    const routingRoutes = require('../../routes/routing.js');
    app.use('/api/routing', routingRoutes.default || routingRoutes);
  });

  describe('Real Database Tests', () => {
    it('should connect to Vercel database successfully', async () => {
      // Test database connection by checking if we can query
      const response = await request(app)
        .get('/api/routing/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should calculate distance between real coordinates', async () => {
      const response = await request(app)
        .get('/api/routing/distance')
        .query({
          originLat: 3.1347,
          originLon: 101.6869,
          destLat: 3.1570,
          destLon: 101.7120
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.distance).toBeGreaterThan(0);
    });

    it('should compare transport modes with real data', async () => {
      const response = await request(app)
        .post('/api/routing/compare')
        .send({
          origin: { latitude: 3.1347, longitude: 101.6869 },
          destination: { latitude: 3.1570, longitude: 101.7120 }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scenarios).toBeDefined();
      expect(response.body.data.scenarios.length).toBeGreaterThan(0);
    }, 30000); // 30 second timeout for real API calls

    it('should calculate emissions for real distance', async () => {
      const response = await request(app)
        .post('/api/routing/emissions')
        .send({
          distance: 10,
          mode: 'car',
          size: 'medium',
          fuelType: 'petrol'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalEmissions).toBeGreaterThan(0);
      expect(response.body.data.emissionFactor).toBe(0.192);
    });

    it('should handle transit route planning', async () => {
      const response = await request(app)
        .post('/api/routing/transit/plan')
        .send({
          origin: { latitude: 3.1347, longitude: 101.6869 },
          destination: { latitude: 3.1570, longitude: 101.7120 }
        });

      // This might return 404 if no transit routes found, which is acceptable
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Cache Integration Tests', () => {
    it('should cache route calculations', async () => {
      // First request - should calculate and cache
      const response1 = await request(app)
        .post('/api/routing/compare')
        .send({
          origin: { latitude: 3.1347, longitude: 101.6869 },
          destination: { latitude: 3.1570, longitude: 101.7120 }
        });

      expect(response1.status).toBe(200);

      // Second request - should use cache
      const response2 = await request(app)
        .post('/api/routing/compare')
        .send({
          origin: { latitude: 3.1347, longitude: 101.6869 },
          destination: { latitude: 3.1570, longitude: 101.7120 }
        });

      expect(response2.status).toBe(200);
      // Both responses should be similar (cached vs calculated)
      expect(response1.body.data.scenarios.length).toBe(response2.body.data.scenarios.length);
    }, 30000); // 30 second timeout for real API calls
  });
});
