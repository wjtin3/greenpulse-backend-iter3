-- Route Cache Schema for GreenPulse
-- Stores pre-calculated routes to speed up common queries

CREATE TABLE IF NOT EXISTS route_cache (
    id SERIAL PRIMARY KEY,
    
    -- Cache key (rounded coordinates for broader matching)
    origin_lat DECIMAL(6, 3) NOT NULL,  -- Rounded to ~100m precision
    origin_lon DECIMAL(6, 3) NOT NULL,
    dest_lat DECIMAL(6, 3) NOT NULL,
    dest_lon DECIMAL(6, 3) NOT NULL,
    mode VARCHAR(20) NOT NULL,  -- 'car', 'motorcycle', 'bicycle', 'walking'
    
    -- Route data
    distance DECIMAL(8, 2) NOT NULL,  -- km
    duration DECIMAL(8, 2) NOT NULL,  -- minutes (can be fractional)
    emissions DECIMAL(8, 4) NOT NULL,  -- kg CO2
    geometry TEXT NOT NULL,  -- Encoded polyline
    
    -- Metadata
    hit_count INTEGER DEFAULT 0,  -- Track popular routes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    
    -- Composite index for fast lookups
    CONSTRAINT unique_route UNIQUE (origin_lat, origin_lon, dest_lat, dest_lon, mode)
);

-- Index for fast lookup
CREATE INDEX idx_route_cache_lookup ON route_cache (
    origin_lat, origin_lon, dest_lat, dest_lon, mode
);

-- Index for finding expired entries
CREATE INDEX idx_route_cache_expiry ON route_cache (expires_at);

-- Index for finding popular routes
CREATE INDEX idx_route_cache_popular ON route_cache (hit_count DESC);

-- Function to round coordinates for caching (100m precision)
CREATE OR REPLACE FUNCTION round_coord(coord DECIMAL) 
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(coord::numeric, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache() 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM route_cache WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Statistics view
CREATE OR REPLACE VIEW route_cache_stats AS
SELECT 
    mode,
    COUNT(*) as total_routes,
    SUM(hit_count) as total_hits,
    AVG(hit_count) as avg_hits_per_route,
    MAX(hit_count) as max_hits,
    MIN(created_at) as oldest_route,
    MAX(updated_at) as newest_route
FROM route_cache
GROUP BY mode
ORDER BY total_hits DESC;

COMMENT ON TABLE route_cache IS 'Caches frequently requested routes to reduce OSRM API calls';
COMMENT ON COLUMN route_cache.hit_count IS 'Number of times this cached route was used';
COMMENT ON COLUMN route_cache.expires_at IS 'Cache expiration (default 30 days, refresh on hit)';

