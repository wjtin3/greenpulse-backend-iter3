-- Routing Service Database Schema
-- Schema for storing route comparison history

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Route comparisons table
CREATE TABLE IF NOT EXISTS route_comparisons (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    origin_lat DOUBLE PRECISION NOT NULL,
    origin_lon DOUBLE PRECISION NOT NULL,
    destination_lat DOUBLE PRECISION NOT NULL,
    destination_lon DOUBLE PRECISION NOT NULL,
    direct_distance DOUBLE PRECISION,
    route_distance DOUBLE PRECISION,
    scenarios JSONB,
    best_option_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_route_comparisons_user_id ON route_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_route_comparisons_created_at ON route_comparisons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_comparisons_origin ON route_comparisons(origin_lat, origin_lon);
CREATE INDEX IF NOT EXISTS idx_route_comparisons_destination ON route_comparisons(destination_lat, destination_lon);

-- Create GiST index for spatial queries (if PostGIS is available)
-- CREATE INDEX IF NOT EXISTS idx_route_comparisons_origin_gist 
-- ON route_comparisons USING GIST (ST_SetSRID(ST_MakePoint(origin_lon, origin_lat), 4326));
-- CREATE INDEX IF NOT EXISTS idx_route_comparisons_destination_gist 
-- ON route_comparisons USING GIST (ST_SetSRID(ST_MakePoint(destination_lon, destination_lat), 4326));

-- Function to get route comparison statistics for a user
CREATE OR REPLACE FUNCTION get_user_route_stats(user_id_param VARCHAR(100))
RETURNS TABLE (
    total_comparisons BIGINT,
    total_distance_compared DOUBLE PRECISION,
    most_used_mode VARCHAR(100),
    average_best_emissions DOUBLE PRECISION,
    first_comparison TIMESTAMP,
    last_comparison TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_comparisons,
        SUM(route_distance)::DOUBLE PRECISION as total_distance_compared,
        (
            SELECT best_option_id 
            FROM route_comparisons 
            WHERE user_id = user_id_param 
            GROUP BY best_option_id 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_used_mode,
        (
            SELECT AVG((scenarios->0->>'emissions')::DOUBLE PRECISION)
            FROM route_comparisons
            WHERE user_id = user_id_param
        ) as average_best_emissions,
        MIN(created_at) as first_comparison,
        MAX(created_at) as last_comparison
    FROM route_comparisons
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get popular routes
CREATE OR REPLACE FUNCTION get_popular_routes(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    origin_lat DOUBLE PRECISION,
    origin_lon DOUBLE PRECISION,
    destination_lat DOUBLE PRECISION,
    destination_lon DOUBLE PRECISION,
    usage_count BIGINT,
    avg_distance DOUBLE PRECISION,
    most_common_best_option VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.origin_lat,
        rc.origin_lon,
        rc.destination_lat,
        rc.destination_lon,
        COUNT(*)::BIGINT as usage_count,
        AVG(rc.route_distance)::DOUBLE PRECISION as avg_distance,
        (
            SELECT rc2.best_option_id
            FROM route_comparisons rc2
            WHERE rc2.origin_lat = rc.origin_lat
            AND rc2.origin_lon = rc.origin_lon
            AND rc2.destination_lat = rc.destination_lat
            AND rc2.destination_lon = rc.destination_lon
            GROUP BY rc2.best_option_id
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_common_best_option
    FROM route_comparisons rc
    GROUP BY rc.origin_lat, rc.origin_lon, rc.destination_lat, rc.destination_lon
    ORDER BY usage_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old route comparisons
CREATE OR REPLACE FUNCTION cleanup_old_route_comparisons(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM route_comparisons
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View for route comparison summary
CREATE OR REPLACE VIEW route_comparison_summary AS
SELECT 
    id,
    user_id,
    origin_lat,
    origin_lon,
    destination_lat,
    destination_lon,
    route_distance,
    best_option_id,
    (scenarios->0->>'name')::TEXT as best_option_name,
    (scenarios->0->>'emissions')::DOUBLE PRECISION as best_emissions,
    (scenarios->(jsonb_array_length(scenarios)-1)->>'name')::TEXT as worst_option_name,
    (scenarios->(jsonb_array_length(scenarios)-1)->>'emissions')::DOUBLE PRECISION as worst_emissions,
    jsonb_array_length(scenarios) as total_options,
    created_at
FROM route_comparisons
ORDER BY created_at DESC;

-- Comments for documentation
COMMENT ON TABLE route_comparisons IS 'Stores route comparison history for carbon emission analysis';
COMMENT ON COLUMN route_comparisons.scenarios IS 'JSONB array of all transport mode scenarios with emissions data';
COMMENT ON COLUMN route_comparisons.best_option_id IS 'ID of the transport mode with lowest emissions';
COMMENT ON FUNCTION get_user_route_stats IS 'Get statistics about a user''s route comparisons';
COMMENT ON FUNCTION get_popular_routes IS 'Get most frequently compared routes';
COMMENT ON FUNCTION cleanup_old_route_comparisons IS 'Remove route comparisons older than specified days';

