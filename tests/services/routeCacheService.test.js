// Jest globals are available without import

// Mock the database pool
const mockPool = {
  query: jest.fn()
};

// Mock the database import
jest.mock('../../config/database.js', () => ({
  pool: mockPool
}));

describe('RouteCacheService', () => {
  let routeCacheService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Import the service after mocking
    const module = require('../../services/routeCacheService.js');
    routeCacheService = module.routeCacheService;
  });

  describe('get', () => {
    it('should return cached route when available', async () => {
      const mockCachedRoute = {
        distance: 10.5,
        duration: 25.0,
        emissions: 2.1,
        geometry: 'cached_polyline',
        hit_count: 5,
        created_at: new Date(),
        origin_lat: 3.135,
        origin_lon: 101.687,
        dest_lat: 3.157,
        dest_lon: 101.712,
        reversed: false
      };

      mockPool.query.mockResolvedValue({ rows: [mockCachedRoute] });

      const result = await routeCacheService.get(3.1347, 101.6869, 3.1570, 101.7120, 'car');

      expect(result).toBeDefined();
      expect(result.distance).toBe(10.5);
      expect(result.cached).toBe(true);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should return null when no cached route found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await routeCacheService.get(3.1347, 101.6869, 3.1570, 101.7120, 'car');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      const result = await routeCacheService.get(3.1347, 101.6869, 3.1570, 101.7120, 'car');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store route in cache successfully', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const routeData = {
        distance: 10.5,
        duration: 25.0,
        emissions: 2.1,
        geometry: 'test_polyline'
      };

      const result = await routeCacheService.set(
        3.1347, 101.6869, 3.1570, 101.7120, 'car', routeData
      );

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should handle cache storage errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Storage error'));

      const routeData = {
        distance: 10.5,
        duration: 25.0,
        emissions: 2.1,
        geometry: 'test_polyline'
      };

      const result = await routeCacheService.set(
        3.1347, 101.6869, 3.1570, 101.7120, 'car', routeData
      );

      expect(result).toBe(false);
    });
  });

  describe('getCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const key1 = routeCacheService.getCacheKey(3.1347, 101.6869, 3.1570, 101.7120, 'car');
      const key2 = routeCacheService.getCacheKey(3.1347, 101.6869, 3.1570, 101.7120, 'car');
      
      expect(key1).toEqual(key2);
    });

    it('should round coordinates to 3 decimal places', () => {
      const key = routeCacheService.getCacheKey(3.1347123, 101.6869456, 3.1570789, 101.7120123, 'car');
      
      expect(key.originLat).toBe(3.135);
      expect(key.originLon).toBe(101.687);
      expect(key.destLat).toBe(3.157);
      expect(key.destLon).toBe(101.712);
    });
  });
});
