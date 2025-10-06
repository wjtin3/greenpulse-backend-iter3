-- GTFS Database Schema for Malaysian Prasarana Data
-- This schema creates separate tables for each category (rapid-bus-mrtfeeder, rapid-rail-kl, rapid-bus-kl)

-- Create GTFS schema
CREATE SCHEMA IF NOT EXISTS gtfs;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS gtfs.create_category_tables(VARCHAR(50));

-- Function to create tables for a specific category
CREATE OR REPLACE FUNCTION gtfs.create_category_tables(category_name VARCHAR(50))
RETURNS VOID AS $$
BEGIN
    -- Agency table for category
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS gtfs.agency_%s (
            agency_id VARCHAR(50) PRIMARY KEY,
            agency_name VARCHAR(255) NOT NULL,
            agency_url VARCHAR(500),
            agency_timezone VARCHAR(50) NOT NULL,
            agency_phone VARCHAR(50),
            agency_lang VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', category_name);

    -- Routes table for category
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS gtfs.routes_%s (
            route_id VARCHAR(50) PRIMARY KEY,
            agency_id VARCHAR(50),
            route_short_name VARCHAR(50),
            route_long_name VARCHAR(255),
            route_desc TEXT,
            route_type INTEGER NOT NULL,
            route_url VARCHAR(500),
            route_color VARCHAR(6),
            route_text_color VARCHAR(6),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agency_id) REFERENCES gtfs.agency_%s(agency_id)
        )', category_name, category_name);

    -- Stops table for category
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS gtfs.stops_%s (
            stop_id VARCHAR(50) PRIMARY KEY,
            stop_code VARCHAR(50),
            stop_name VARCHAR(255) NOT NULL,
            stop_desc TEXT,
            stop_lat DECIMAL(10, 8) NOT NULL,
            stop_lon DECIMAL(11, 8) NOT NULL,
            zone_id VARCHAR(50),
            stop_url VARCHAR(500),
            location_type INTEGER DEFAULT 0,
            parent_station VARCHAR(50),
            stop_timezone VARCHAR(50),
            wheelchair_boarding INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_station) REFERENCES gtfs.stops_%s(stop_id)
        )', category_name, category_name);

    -- Calendar table for category
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS gtfs.calendar_%s (
            service_id VARCHAR(50) PRIMARY KEY,
            monday BOOLEAN NOT NULL DEFAULT FALSE,
            tuesday BOOLEAN NOT NULL DEFAULT FALSE,
            wednesday BOOLEAN NOT NULL DEFAULT FALSE,
            thursday BOOLEAN NOT NULL DEFAULT FALSE,
            friday BOOLEAN NOT NULL DEFAULT FALSE,
            saturday BOOLEAN NOT NULL DEFAULT FALSE,
            sunday BOOLEAN NOT NULL DEFAULT FALSE,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )', category_name);

    -- Calendar dates table for category
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS gtfs.calendar_dates_%s (
            service_id VARCHAR(50) NOT NULL,
            date DATE NOT NULL,
            exception_type INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (service_id, date),
            FOREIGN KEY (service_id) REFERENCES gtfs.calendar_%s(service_id)
        )', category_name, category_name);

    -- Trips table for category
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS gtfs.trips_%s (
            route_id VARCHAR(50) NOT NULL,
            service_id VARCHAR(50) NOT NULL,
            trip_id VARCHAR(50) PRIMARY KEY,
            trip_headsign VARCHAR(255),
            trip_short_name VARCHAR(50),
            direction_id INTEGER,
            block_id VARCHAR(50),
            shape_id VARCHAR(50),
            wheelchair_accessible INTEGER DEFAULT 0,
            bikes_allowed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (route_id) REFERENCES gtfs.routes_%s(route_id),
            FOREIGN KEY (service_id) REFERENCES gtfs.calendar_%s(service_id)
        )', category_name, category_name, category_name);

    -- Stop times table for category
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS gtfs.stop_times_%s (
            trip_id VARCHAR(50) NOT NULL,
            arrival_time TIME,
            departure_time TIME,
            stop_id VARCHAR(50) NOT NULL,
            stop_sequence INTEGER NOT NULL,
            stop_headsign VARCHAR(255),
            pickup_type INTEGER DEFAULT 0,
            drop_off_type INTEGER DEFAULT 0,
            continuous_pickup INTEGER DEFAULT 0,
            continuous_drop_off INTEGER DEFAULT 0,
            shape_dist_traveled DECIMAL(10, 6),
            timepoint INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (trip_id, stop_sequence),
            FOREIGN KEY (trip_id) REFERENCES gtfs.trips_%s(trip_id),
            FOREIGN KEY (stop_id) REFERENCES gtfs.stops_%s(stop_id)
        )', category_name, category_name, category_name);

    -- Shapes table for category
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS gtfs.shapes_%s (
            shape_id VARCHAR(50) NOT NULL,
            shape_pt_lat DECIMAL(10, 8) NOT NULL,
            shape_pt_lon DECIMAL(11, 8) NOT NULL,
            shape_pt_sequence INTEGER NOT NULL,
            shape_dist_traveled DECIMAL(10, 6),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (shape_id, shape_pt_sequence)
        )', category_name);

    -- Create indexes for better performance
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_routes_%s_agency_id ON gtfs.routes_%s(agency_id)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_stops_%s_location ON gtfs.stops_%s(stop_lat, stop_lon)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_trips_%s_route_id ON gtfs.trips_%s(route_id)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_trips_%s_service_id ON gtfs.trips_%s(service_id)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_stop_times_%s_trip_id ON gtfs.stop_times_%s(trip_id)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_stop_times_%s_stop_id ON gtfs.stop_times_%s(stop_id)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_calendar_dates_%s_service_id ON gtfs.calendar_dates_%s(service_id)', category_name, category_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_shapes_%s_shape_id ON gtfs.shapes_%s(shape_id)', category_name, category_name);

END;
$$ LANGUAGE plpgsql;

-- Create tables for all categories
SELECT gtfs.create_category_tables('rapid_bus_mrtfeeder');
SELECT gtfs.create_category_tables('rapid_rail_kl');
SELECT gtfs.create_category_tables('rapid_bus_kl');

-- Create views for each category
CREATE OR REPLACE VIEW gtfs.trip_details_rapid_bus_mrtfeeder AS
SELECT 
    t.trip_id,
    t.route_id,
    r.route_short_name,
    r.route_long_name,
    r.route_type,
    t.trip_headsign,
    t.direction_id,
    c.service_id,
    c.monday,
    c.tuesday,
    c.wednesday,
    c.thursday,
    c.friday,
    c.saturday,
    c.sunday,
    c.start_date,
    c.end_date
FROM gtfs.trips_rapid_bus_mrtfeeder t
JOIN gtfs.routes_rapid_bus_mrtfeeder r ON t.route_id = r.route_id
JOIN gtfs.calendar_rapid_bus_mrtfeeder c ON t.service_id = c.service_id;

CREATE OR REPLACE VIEW gtfs.trip_details_rapid_rail_kl AS
SELECT 
    t.trip_id,
    t.route_id,
    r.route_short_name,
    r.route_long_name,
    r.route_type,
    t.trip_headsign,
    t.direction_id,
    c.service_id,
    c.monday,
    c.tuesday,
    c.wednesday,
    c.thursday,
    c.friday,
    c.saturday,
    c.sunday,
    c.start_date,
    c.end_date
FROM gtfs.trips_rapid_rail_kl t
JOIN gtfs.routes_rapid_rail_kl r ON t.route_id = r.route_id
JOIN gtfs.calendar_rapid_rail_kl c ON t.service_id = c.service_id;

CREATE OR REPLACE VIEW gtfs.trip_details_rapid_bus_kl AS
SELECT 
    t.trip_id,
    t.route_id,
    r.route_short_name,
    r.route_long_name,
    r.route_type,
    t.trip_headsign,
    t.direction_id,
    c.service_id,
    c.monday,
    c.tuesday,
    c.wednesday,
    c.thursday,
    c.friday,
    c.saturday,
    c.sunday,
    c.start_date,
    c.end_date
FROM gtfs.trips_rapid_bus_kl t
JOIN gtfs.routes_rapid_bus_kl r ON t.route_id = r.route_id
JOIN gtfs.calendar_rapid_bus_kl c ON t.service_id = c.service_id;

-- Create a function to get stops within a radius for a specific category
CREATE OR REPLACE FUNCTION gtfs.get_stops_within_radius(
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    radius_km DECIMAL(10, 2),
    category_name VARCHAR(50)
)
RETURNS TABLE (
    stop_id VARCHAR(50),
    stop_name VARCHAR(255),
    stop_lat DECIMAL(10, 8),
    stop_lon DECIMAL(11, 8),
    distance_km DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            s.stop_id,
            s.stop_name,
            s.stop_lat,
            s.stop_lon,
            ROUND(
                6371 * acos(
                    cos(radians(%s)) * cos(radians(s.stop_lat)) * 
                    cos(radians(s.stop_lon) - radians(%s)) + 
                    sin(radians(%s)) * sin(radians(s.stop_lat))
                )::DECIMAL, 2
            ) as distance_km
        FROM gtfs.stops_%s s
        WHERE 6371 * acos(
            cos(radians(%s)) * cos(radians(s.stop_lat)) * 
            cos(radians(s.stop_lon) - radians(%s)) + 
            sin(radians(%s)) * sin(radians(s.stop_lat))
        ) <= %s
        ORDER BY distance_km',
        lat, lon, lat, category_name, lat, lon, lat, radius_km
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get next departures from a stop for a specific category
CREATE OR REPLACE FUNCTION gtfs.get_next_departures(
    stop_id_param VARCHAR(50),
    category_name VARCHAR(50),
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    trip_id VARCHAR(50),
    route_short_name VARCHAR(50),
    route_long_name VARCHAR(255),
    trip_headsign VARCHAR(255),
    departure_time TIME,
    stop_sequence INTEGER
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            st.trip_id,
            r.route_short_name,
            r.route_long_name,
            t.trip_headsign,
            st.departure_time,
            st.stop_sequence
        FROM gtfs.stop_times_%s st
        JOIN gtfs.trips_%s t ON st.trip_id = t.trip_id
        JOIN gtfs.routes_%s r ON t.route_id = r.route_id
        WHERE st.stop_id = %L
        AND st.departure_time >= CURRENT_TIME
        ORDER BY st.departure_time
        LIMIT %s',
        category_name, category_name, category_name, stop_id_param, limit_count
    );
END;
$$ LANGUAGE plpgsql;
