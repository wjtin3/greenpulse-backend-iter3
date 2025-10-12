-- GTFS Realtime Schema for Vehicle Positions
-- This schema creates tables for storing real-time vehicle position data from Prasarana

-- Create GTFS schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS gtfs;

-- Function to create vehicle position table for a specific category
CREATE OR REPLACE FUNCTION gtfs.create_realtime_vehicle_positions_table(category_name VARCHAR(50))
RETURNS VOID AS $$
BEGIN
    -- Vehicle positions table for category
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS gtfs.vehicle_positions_%s (
            id SERIAL PRIMARY KEY,
            vehicle_id VARCHAR(100),
            trip_id VARCHAR(100),
            route_id VARCHAR(100),
            trip_start_time VARCHAR(20),
            trip_start_date VARCHAR(20),
            direction_id INTEGER,
            schedule_relationship VARCHAR(50),
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            bearing REAL,
            odometer DOUBLE PRECISION,
            speed REAL,
            current_stop_sequence INTEGER,
            stop_id VARCHAR(100),
            current_status VARCHAR(50),
            position_timestamp BIGINT NOT NULL,
            congestion_level VARCHAR(50),
            occupancy_status VARCHAR(50),
            vehicle_label VARCHAR(100),
            vehicle_license_plate VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_vehicle_timestamp_%s UNIQUE (vehicle_id, position_timestamp)
        )', category_name, category_name);

    -- Create indexes for better query performance
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_vehicle_positions_%s_vehicle_id ON gtfs.vehicle_positions_%s(vehicle_id)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_vehicle_positions_%s_trip_id ON gtfs.vehicle_positions_%s(trip_id)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_vehicle_positions_%s_route_id ON gtfs.vehicle_positions_%s(route_id)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_vehicle_positions_%s_position_timestamp ON gtfs.vehicle_positions_%s(position_timestamp DESC)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_vehicle_positions_%s_location ON gtfs.vehicle_positions_%s(latitude, longitude)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_vehicle_positions_%s_created_at ON gtfs.vehicle_positions_%s(created_at DESC)', category_name, category_name);

END;
$$ LANGUAGE plpgsql;

-- Create vehicle position tables for all categories
SELECT gtfs.create_realtime_vehicle_positions_table('rapid_bus_mrtfeeder');
SELECT gtfs.create_realtime_vehicle_positions_table('rapid_rail_kl');
SELECT gtfs.create_realtime_vehicle_positions_table('rapid_bus_kl');
SELECT gtfs.create_realtime_vehicle_positions_table('ktmb');

-- Function to clean up old vehicle positions (older than specified hours)
CREATE OR REPLACE FUNCTION gtfs.cleanup_old_vehicle_positions(
    category_name VARCHAR(50),
    hours_to_keep INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    EXECUTE format('
        DELETE FROM gtfs.vehicle_positions_%s
        WHERE created_at < NOW() - INTERVAL ''%s hours''
    ', category_name, hours_to_keep);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest vehicle positions for a category
CREATE OR REPLACE FUNCTION gtfs.get_latest_vehicle_positions(
    category_name VARCHAR(50),
    minutes_old INTEGER DEFAULT 10
)
RETURNS TABLE (
    vehicle_id VARCHAR(100),
    trip_id VARCHAR(100),
    route_id VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bearing REAL,
    speed REAL,
    position_timestamp BIGINT,
    vehicle_label VARCHAR(100),
    current_status VARCHAR(50),
    occupancy_status VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT DISTINCT ON (vp.vehicle_id)
            vp.vehicle_id,
            vp.trip_id,
            vp.route_id,
            vp.latitude,
            vp.longitude,
            vp.bearing,
            vp.speed,
            vp.position_timestamp,
            vp.vehicle_label,
            vp.current_status,
            vp.occupancy_status
        FROM gtfs.vehicle_positions_%s vp
        WHERE vp.created_at >= NOW() - INTERVAL ''%s minutes''
        ORDER BY vp.vehicle_id, vp.position_timestamp DESC
    ', category_name, minutes_old);
END;
$$ LANGUAGE plpgsql;

-- Function to get vehicle positions within a radius
CREATE OR REPLACE FUNCTION gtfs.get_vehicle_positions_within_radius(
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    radius_km DOUBLE PRECISION,
    category_name VARCHAR(50),
    minutes_old INTEGER DEFAULT 10
)
RETURNS TABLE (
    vehicle_id VARCHAR(100),
    trip_id VARCHAR(100),
    route_id VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bearing REAL,
    speed REAL,
    distance_km DOUBLE PRECISION,
    position_timestamp BIGINT
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT DISTINCT ON (vp.vehicle_id)
            vp.vehicle_id,
            vp.trip_id,
            vp.route_id,
            vp.latitude,
            vp.longitude,
            vp.bearing,
            vp.speed,
            ROUND(
                (6371 * acos(
                    cos(radians(%s)) * cos(radians(vp.latitude)) * 
                    cos(radians(vp.longitude) - radians(%s)) + 
                    sin(radians(%s)) * sin(radians(vp.latitude))
                ))::NUMERIC, 2
            ) as distance_km,
            vp.position_timestamp
        FROM gtfs.vehicle_positions_%s vp
        WHERE vp.created_at >= NOW() - INTERVAL ''%s minutes''
        AND 6371 * acos(
            cos(radians(%s)) * cos(radians(vp.latitude)) * 
            cos(radians(vp.longitude) - radians(%s)) + 
            sin(radians(%s)) * sin(radians(vp.latitude))
        ) <= %s
        ORDER BY vp.vehicle_id, vp.position_timestamp DESC
    ', lat, lon, lat, category_name, minutes_old, lat, lon, lat, radius_km);
END;
$$ LANGUAGE plpgsql;

-- Function to get vehicle position history for a specific vehicle
CREATE OR REPLACE FUNCTION gtfs.get_vehicle_history(
    vehicle_id_param VARCHAR(100),
    category_name VARCHAR(50),
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    vehicle_id VARCHAR(100),
    trip_id VARCHAR(100),
    route_id VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bearing REAL,
    speed REAL,
    position_timestamp BIGINT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            vp.vehicle_id,
            vp.trip_id,
            vp.route_id,
            vp.latitude,
            vp.longitude,
            vp.bearing,
            vp.speed,
            vp.position_timestamp,
            vp.created_at
        FROM gtfs.vehicle_positions_%s vp
        WHERE vp.vehicle_id = %L
        AND vp.created_at >= NOW() - INTERVAL ''%s hours''
        ORDER BY vp.position_timestamp DESC
    ', category_name, vehicle_id_param, hours_back);
END;
$$ LANGUAGE plpgsql;

-- View to get current vehicle positions across all categories
CREATE OR REPLACE VIEW gtfs.all_vehicle_positions_current AS
SELECT 
    'rapid-bus-mrtfeeder' as category,
    vehicle_id,
    trip_id,
    route_id,
    latitude,
    longitude,
    bearing,
    speed,
    position_timestamp,
    vehicle_label,
    current_status,
    occupancy_status,
    created_at
FROM gtfs.vehicle_positions_rapid_bus_mrtfeeder
WHERE created_at >= NOW() - INTERVAL '10 minutes'

UNION ALL

SELECT 
    'rapid-rail-kl' as category,
    vehicle_id,
    trip_id,
    route_id,
    latitude,
    longitude,
    bearing,
    speed,
    position_timestamp,
    vehicle_label,
    current_status,
    occupancy_status,
    created_at
FROM gtfs.vehicle_positions_rapid_rail_kl
WHERE created_at >= NOW() - INTERVAL '10 minutes'

UNION ALL

SELECT 
    'rapid-bus-kl' as category,
    vehicle_id,
    trip_id,
    route_id,
    latitude,
    longitude,
    bearing,
    speed,
    position_timestamp,
    vehicle_label,
    current_status,
    occupancy_status,
    created_at
FROM gtfs.vehicle_positions_rapid_bus_kl
WHERE created_at >= NOW() - INTERVAL '10 minutes';

-- Grant permissions (adjust as needed for your security requirements)
-- GRANT USAGE ON SCHEMA gtfs TO your_app_user;
-- GRANT SELECT, INSERT, DELETE ON ALL TABLES IN SCHEMA gtfs TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA gtfs TO your_app_user;

