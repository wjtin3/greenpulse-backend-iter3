const request = require('supertest');
const express = require('express');

// Use actual services - no mocking

describe('Routing API Routes', () => {
  let app;

  beforeAll(async () => {
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Import and use the routing routes
    const routingRoutes = require('../../routes/routing.js');
    app.use('/api/routing', routingRoutes.default || routingRoutes);
  });

  describe('GET /api/routing/health', () => {
    it('should return service health status', async () => {
      const response = await request(app)
        .get('/api/routing/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.service).toBe('Routing Service');
    });
  });

  describe('POST /api/routing/compare', () => {
    it('should handle route comparison request', async () => {
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

    it('should handle invalid coordinates', async () => {
      const response = await request(app)
        .post('/api/routing/compare')
        .send({
          origin: { latitude: 999, longitude: 999 },
          destination: { latitude: 3.1570, longitude: 101.7120 }
        });

      // The service might handle invalid coordinates differently
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle missing origin coordinates', async () => {
      const response = await request(app)
        .post('/api/routing/compare')
        .send({
          destination: { latitude: 3.1570, longitude: 101.7120 }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required parameters');
    });

    it('should handle missing destination coordinates', async () => {
      const response = await request(app)
        .post('/api/routing/compare')
        .send({
          origin: { latitude: 3.1347, longitude: 101.6869 }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required parameters');
    });
  });

  describe('POST /api/routing/compare/quick', () => {
    it('should handle quick comparison request', async () => {
      const response = await request(app)
        .post('/api/routing/compare/quick')
        .send({
          origin: { latitude: 3.1347, longitude: 101.6869 },
          destination: { latitude: 3.1570, longitude: 101.7120 }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scenarios).toBeDefined();
      expect(response.body.data.scenarios.length).toBeGreaterThan(0);
    }, 30000); // 30 second timeout for real API calls
  });

  describe('GET /api/routing/distance', () => {
    it('should calculate distance between two points', async () => {
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
      expect(response.body.data.distance).toBeDefined();
      expect(response.body.data.distance).toBeGreaterThan(0);
    });

    it('should handle missing parameters', async () => {
      const response = await request(app)
        .get('/api/routing/distance');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/routing/emissions', () => {
    it('should calculate emissions for specific mode', async () => {
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
      expect(response.body.data.mode).toBe('car');
    });

    it('should handle missing distance parameter', async () => {
      const response = await request(app)
        .post('/api/routing/emissions')
        .send({
          mode: 'car'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/routing/transit/plan', () => {
    it('should handle transit route planning', async () => {
      const response = await request(app)
        .post('/api/routing/transit/plan')
        .send({
          origin: { latitude: 3.1347, longitude: 101.6869 },
          destination: { latitude: 3.1570, longitude: 101.7120 }
        });

      // Transit routes might not be available for all locations
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.routes).toBeDefined();
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle no transit routes found', async () => {
      // Test with coordinates that are unlikely to have transit routes
      const response = await request(app)
        .post('/api/routing/transit/plan')
        .send({
          origin: { latitude: 1.0, longitude: 1.0 },
          destination: { latitude: 1.1, longitude: 1.1 }
        });

      expect([404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });
});
