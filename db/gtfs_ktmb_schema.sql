-- GTFS Schema for KTMB (KTM Komuter - Malaysia's commuter rail)
-- Based on GTFS specification and data.gov.my feed structure
-- Source: https://api.data.gov.my/gtfs-static/ktmb

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS gtfs;

-- ============================================
-- KTMB GTFS Tables
-- ============================================

-- Agency
CREATE TABLE IF NOT EXISTS gtfs.agency_ktmb (
    agency_id TEXT PRIMARY KEY,
    agency_name TEXT NOT NULL,
    agency_url TEXT NOT NULL,
    agency_timezone TEXT NOT NULL,
    agency_lang TEXT,
    agency_phone TEXT,
    agency_fare_url TEXT,
    agency_email TEXT
);

-- Routes (Train lines)
CREATE TABLE IF NOT EXISTS gtfs.routes_ktmb (
    route_id TEXT PRIMARY KEY,
    agency_id TEXT,
    route_short_name TEXT,
    route_long_name TEXT NOT NULL,
    route_type INTEGER NOT NULL, -- 2 = Rail
    route_color TEXT,
    route_text_color TEXT,
    route_url TEXT,
    route_desc TEXT,
    FOREIGN KEY (agency_id) REFERENCES gtfs.agency_ktmb(agency_id)
);

-- Stops (Train stations)
CREATE TABLE IF NOT EXISTS gtfs.stops_ktmb (
    stop_id TEXT PRIMARY KEY,
    stop_code TEXT,
    stop_name TEXT NOT NULL,
    stop_desc TEXT,
    stop_lat DECIMAL(10, 8) NOT NULL,
    stop_lon DECIMAL(11, 8) NOT NULL,
    zone_id TEXT,
    stop_url TEXT,
    location_type INTEGER DEFAULT 0,
    parent_station TEXT,
    stop_timezone TEXT,
    wheelchair_boarding INTEGER,
    platform_code TEXT,
    category TEXT DEFAULT 'ktmb'
);

-- Create spatial index on stops (requires PostGIS extension)
-- CREATE INDEX IF NOT EXISTS idx_stops_ktmb_location 
-- ON gtfs.stops_ktmb USING GIST (
--     ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)
-- );
-- Note: Spatial index commented out - enable PostGIS first if needed:
--   CREATE EXTENSION IF NOT EXISTS postgis;

-- Alternative: Use standard B-tree indexes for lat/lon
CREATE INDEX IF NOT EXISTS idx_stops_ktmb_lat ON gtfs.stops_ktmb(stop_lat);
CREATE INDEX IF NOT EXISTS idx_stops_ktmb_lon ON gtfs.stops_ktmb(stop_lon);

-- Trips
CREATE TABLE IF NOT EXISTS gtfs.trips_ktmb (
    trip_id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    trip_headsign TEXT,
    trip_short_name TEXT,
    direction_id INTEGER,
    block_id TEXT,
    shape_id TEXT,
    wheelchair_accessible INTEGER,
    bikes_allowed INTEGER,
    FOREIGN KEY (route_id) REFERENCES gtfs.routes_ktmb(route_id)
);

-- Stop Times (Train schedules)
CREATE TABLE IF NOT EXISTS gtfs.stop_times_ktmb (
    trip_id TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    stop_id TEXT NOT NULL,
    stop_sequence INTEGER NOT NULL,
    stop_headsign TEXT,
    pickup_type INTEGER DEFAULT 0,
    drop_off_type INTEGER DEFAULT 0,
    shape_dist_traveled DECIMAL(10, 2),
    timepoint INTEGER,
    PRIMARY KEY (trip_id, stop_sequence),
    FOREIGN KEY (trip_id) REFERENCES gtfs.trips_ktmb(trip_id),
    FOREIGN KEY (stop_id) REFERENCES gtfs.stops_ktmb(stop_id)
);

CREATE INDEX IF NOT EXISTS idx_stop_times_ktmb_trip ON gtfs.stop_times_ktmb(trip_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_ktmb_stop ON gtfs.stop_times_ktmb(stop_id);

-- Calendar (Service schedules)
CREATE TABLE IF NOT EXISTS gtfs.calendar_ktmb (
    service_id TEXT PRIMARY KEY,
    monday INTEGER NOT NULL,
    tuesday INTEGER NOT NULL,
    wednesday INTEGER NOT NULL,
    thursday INTEGER NOT NULL,
    friday INTEGER NOT NULL,
    saturday INTEGER NOT NULL,
    sunday INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL
);

-- Calendar Dates (Exceptions)
CREATE TABLE IF NOT EXISTS gtfs.calendar_dates_ktmb (
    service_id TEXT NOT NULL,
    date TEXT NOT NULL,
    exception_type INTEGER NOT NULL,
    PRIMARY KEY (service_id, date)
);

-- Shapes (Route geometries)
CREATE TABLE IF NOT EXISTS gtfs.shapes_ktmb (
    shape_id TEXT NOT NULL,
    shape_pt_lat DECIMAL(10, 8) NOT NULL,
    shape_pt_lon DECIMAL(11, 8) NOT NULL,
    shape_pt_sequence INTEGER NOT NULL,
    shape_dist_traveled DECIMAL(10, 2),
    PRIMARY KEY (shape_id, shape_pt_sequence)
);

CREATE INDEX IF NOT EXISTS idx_shapes_ktmb_id ON gtfs.shapes_ktmb(shape_id);

-- Frequencies (Headway-based schedules, if applicable)
CREATE TABLE IF NOT EXISTS gtfs.frequencies_ktmb (
    trip_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    headway_secs INTEGER NOT NULL,
    exact_times INTEGER,
    PRIMARY KEY (trip_id, start_time),
    FOREIGN KEY (trip_id) REFERENCES gtfs.trips_ktmb(trip_id)
);

-- Transfers (Station transfer information)
CREATE TABLE IF NOT EXISTS gtfs.transfers_ktmb (
    from_stop_id TEXT NOT NULL,
    to_stop_id TEXT NOT NULL,
    transfer_type INTEGER NOT NULL,
    min_transfer_time INTEGER,
    PRIMARY KEY (from_stop_id, to_stop_id),
    FOREIGN KEY (from_stop_id) REFERENCES gtfs.stops_ktmb(stop_id),
    FOREIGN KEY (to_stop_id) REFERENCES gtfs.stops_ktmb(stop_id)
);

-- Feed Info (Metadata about the GTFS feed)
CREATE TABLE IF NOT EXISTS gtfs.feed_info_ktmb (
    feed_publisher_name TEXT NOT NULL,
    feed_publisher_url TEXT NOT NULL,
    feed_lang TEXT NOT NULL,
    feed_start_date TEXT,
    feed_end_date TEXT,
    feed_version TEXT,
    feed_contact_email TEXT,
    feed_contact_url TEXT
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_routes_ktmb_type ON gtfs.routes_ktmb(route_type);
CREATE INDEX IF NOT EXISTS idx_trips_ktmb_route ON gtfs.trips_ktmb(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_ktmb_service ON gtfs.trips_ktmb(service_id);
CREATE INDEX IF NOT EXISTS idx_trips_ktmb_shape ON gtfs.trips_ktmb(shape_id);
CREATE INDEX IF NOT EXISTS idx_calendar_ktmb_dates ON gtfs.calendar_ktmb(start_date, end_date);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE gtfs.agency_ktmb IS 'KTMB agency information';
COMMENT ON TABLE gtfs.routes_ktmb IS 'KTMB train routes (Komuter lines, etc.)';
COMMENT ON TABLE gtfs.stops_ktmb IS 'KTMB train stations';
COMMENT ON TABLE gtfs.trips_ktmb IS 'KTMB train trips';
COMMENT ON TABLE gtfs.stop_times_ktmb IS 'KTMB train schedules at each station';
COMMENT ON TABLE gtfs.calendar_ktmb IS 'KTMB service calendar';
COMMENT ON TABLE gtfs.shapes_ktmb IS 'KTMB route geometries';

-- Grant permissions (adjust as needed)
-- GRANT SELECT ON ALL TABLES IN SCHEMA gtfs TO your_app_user;

