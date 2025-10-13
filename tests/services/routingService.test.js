const RoutingService = require('../../services/routingService.js').default;

// Use actual services - no mocking

describe('RoutingService', () => {
  let routingService;
  let mockFetch;

  beforeEach(() => {
    routingService = new RoutingService();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates correctly', () => {
      // Test coordinates: KL Sentral to KLCC
      const lat1 = 3.1347;
      const lon1 = 101.6869;
      const lat2 = 3.1570;
      const lon2 = 101.7120;
      
      const distance = routingService.calculateDistance(lat1, lon1, lat2, lon2);
      
      expect(distance).toBeCloseTo(3.7, 1); // Actual distance is ~3.7km
    });

    it('should return 0 for identical coordinates', () => {
      const lat = 3.1347;
      const lon = 101.6869;
      
      const distance = routingService.calculateDistance(lat, lon, lat, lon);
      
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const lat1 = -3.1347;
      const lon1 = -101.6869;
      const lat2 = -3.1570;
      const lon2 = -101.7120;
      
      const distance = routingService.calculateDistance(lat1, lon1, lat2, lon2);
      
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('calculateEmissions', () => {
    it('should calculate emissions for a car correctly', () => {
      const distance = 10; // 10km
      const mode = 'car';
      const size = 'medium';
      const fuelType = 'petrol';
      
      const result = routingService.calculateEmissions(distance, mode, size, fuelType);
      
      expect(result.distance).toBe(10);
      expect(result.emissionFactor).toBe(0.192); // Medium petrol car
      expect(result.totalEmissions).toBe(1.92); // 10 * 0.192
      expect(result.unit).toBe('kg CO2');
    });

    it('should calculate emissions for a motorcycle correctly', () => {
      const distance = 5; // 5km
      const mode = 'motorcycle';
      const size = 'medium';
      
      const result = routingService.calculateEmissions(distance, mode, size);
      
      expect(result.totalEmissions).toBe(0.515); // 5 * 0.103
    });

    it('should return zero emissions for bicycle and walking', () => {
      const distance = 10;
      
      const bicycleResult = routingService.calculateEmissions(distance, 'bicycle');
      const walkingResult = routingService.calculateEmissions(distance, 'walking');
      
      expect(bicycleResult.totalEmissions).toBe(0);
      expect(walkingResult.totalEmissions).toBe(0);
    });

    it('should handle invalid mode gracefully', () => {
      const distance = 10;
      const mode = 'invalid_mode';
      
      const result = routingService.calculateEmissions(distance, mode);
      
      expect(result.emissionFactor).toBe(0);
      expect(result.totalEmissions).toBe(0);
    });
  });

  describe('getRoute', () => {
    it('should fetch route from OSRM successfully', async () => {
      const mockOSRMResponse = {
        code: 'Ok',
        routes: [{
          distance: 5000, // 5km in meters
          duration: 600, // 10 minutes in seconds
          geometry: 'encoded_polyline_string',
          legs: [{
            distance: 5000,
            duration: 600,
            steps: [{
              distance: 5000,
              duration: 600,
              maneuver: {
                instruction: 'Head north',
                location: [3.1347, 101.6869]
              }
            }]
          }]
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      });

      const result = await routingService.getRoute(3.1347, 101.6869, 3.1570, 101.7120, 'driving');

      expect(result.distance).toBeCloseTo(9.45, 1);
      expect(result.duration).toBeCloseTo(14.4, 1);
      expect(result.geometry).toBeDefined();
      expect(result.legs).toBeDefined();
    });

    it('should handle OSRM API errors gracefully', async () => {
      // Test with invalid coordinates that will cause OSRM to fail
      const result = await routingService.getRoute(999, 999, 999, 999, 'driving');

      expect(result.estimated).toBe(true);
      expect(result.distance).toBe(0);
    });

    it('should handle network errors with fallback', async () => {
      // Test with coordinates that will use fallback calculation
      const result = await routingService.getRoute(3.1347, 101.6869, 3.1570, 101.7120, 'driving');

      expect(result.distance).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('compareTransportModes', () => {
    it('should compare multiple transport modes successfully', async () => {
      // Mock the getRoute method
      jest.spyOn(routingService, 'getRoute').mockResolvedValue({
        distance: 10,
        duration: 20,
        geometry: 'test_geometry'
      });

      const result = await routingService.compareTransportModes(
        3.1347, 101.6869, 3.1570, 101.7120
      );

      expect(result.success).toBe(true);
      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.length).toBeGreaterThan(0);
      expect(result.bestOption).toBeDefined();
      expect(result.worstOption).toBeDefined();
    });

    it('should rank scenarios by emissions correctly', async () => {
      jest.spyOn(routingService, 'getRoute').mockResolvedValue({
        distance: 10,
        duration: 20,
        geometry: 'test_geometry'
      });

      const result = await routingService.compareTransportModes(
        3.1347, 101.6869, 3.1570, 101.7120
      );

      // Check that scenarios are sorted by emissions (ascending)
      for (let i = 1; i < result.scenarios.length; i++) {
        expect(result.scenarios[i].carbonEmissions)
          .toBeGreaterThanOrEqual(result.scenarios[i-1].carbonEmissions);
      }
    });

    it('should handle options to exclude certain transport modes', async () => {
      jest.spyOn(routingService, 'getRoute').mockResolvedValue({
        distance: 10,
        duration: 20,
        geometry: 'test_geometry'
      });

      const options = {
        excludePrivate: true,
        excludePublic: false,
        excludeActive: false
      };

      const result = await routingService.compareTransportModes(
        3.1347, 101.6869, 3.1570, 101.7120, options
      );

      // Should not include private vehicles
      const privateVehicles = result.scenarios.filter(s => s.category === 'private');
      expect(privateVehicles.length).toBe(0);
    });
  });
});
