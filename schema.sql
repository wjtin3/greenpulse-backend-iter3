-- PostgreSQL Optimized Schema for GreenPulse Backend
-- This schema includes improvements for better PostgreSQL compatibility and performance

-- Travel Schema
-- 车辆分类表 Vehicle Type Classification Table
CREATE TABLE IF NOT EXISTS vehicle_category (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL
);

-- 燃料类型表 Fuel Type Table
CREATE TABLE IF NOT EXISTS fuel_type (
    id SERIAL PRIMARY KEY,
    fuel_name VARCHAR(50) NOT NULL
);

-- 车辆尺寸表 Vehicle Size Table
CREATE TABLE IF NOT EXISTS vehicle_size (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    size_name VARCHAR(50) NOT NULL,
    description TEXT,
    fuel_id INTEGER NOT NULL,
    CONSTRAINT fk_vehicle_size_category 
        FOREIGN KEY (category_id) REFERENCES vehicle_category(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_vehicle_size_fuel 
        FOREIGN KEY (fuel_id) REFERENCES fuel_type(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 车辆排放因子表 Vehicle Emission Factor Table (Only contains private vehicle)
CREATE TABLE IF NOT EXISTS vehicle_emission_factor (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    size_id INTEGER NOT NULL,
    fuel_id INTEGER NOT NULL,
    emission_value NUMERIC(10,6) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    CONSTRAINT fk_vehicle_emission_category 
        FOREIGN KEY (category_id) REFERENCES vehicle_category(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_vehicle_emission_size 
        FOREIGN KEY (size_id) REFERENCES vehicle_size(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_vehicle_emission_fuel 
        FOREIGN KEY (fuel_id) REFERENCES fuel_type(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 公共交通表 Public Transport Table
CREATE TABLE IF NOT EXISTS public_transport (
    id SERIAL PRIMARY KEY,
    transport_type VARCHAR(50) NOT NULL,
    emission_factor NUMERIC(10,6) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    fuel_id INTEGER NOT NULL,
    CONSTRAINT fk_public_transport_fuel 
        FOREIGN KEY (fuel_id) REFERENCES fuel_type(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 家庭因素数据库表结构 Household Factors Database Schema

-- 地区表 Region Table
CREATE TABLE IF NOT EXISTS region (
    id SERIAL PRIMARY KEY,
    region_name VARCHAR(50) NOT NULL
);

-- 家庭因素分类表 Household Factor Category Table
CREATE TABLE IF NOT EXISTS household_factor_category (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL
);

-- 家庭因素表 Household Factors Table
CREATE TABLE IF NOT EXISTS household_factors (
    id SERIAL PRIMARY KEY,
    factor_name VARCHAR(100) NOT NULL,
    category_id INTEGER NOT NULL,
    region_id INTEGER,
    unit VARCHAR(20) NOT NULL,
    emission_factor NUMERIC(10,6) NOT NULL,
    description TEXT,
    CONSTRAINT fk_household_factors_category 
        FOREIGN KEY (category_id) REFERENCES household_factor_category(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_household_factors_region 
        FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Food Schema
CREATE TABLE IF NOT EXISTS food_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Table to store subcategories, linked to a main category.
-- e.g., 'Fruits', 'Vegetables', 'Red Meats'
CREATE TABLE IF NOT EXISTS food_subcategories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL,
    product_count INTEGER DEFAULT 0,
    average_emission NUMERIC(10, 6),
    CONSTRAINT fk_food_subcategories_categories
        FOREIGN KEY (category_id) REFERENCES food_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE (name, category_id)
);

-- Table to store the specific food entities (products).
-- e.g., 'Apples', 'Beef steak'
CREATE TABLE IF NOT EXISTS food_entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    subcategory_id INTEGER NOT NULL,
    CONSTRAINT fk_food_entities_subcategories
        FOREIGN KEY (subcategory_id) REFERENCES food_subcategories (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table to store emission factors for each food entity.
-- The unit is assumed to be 'kg CO2e/kg' based on the source file.
CREATE TABLE IF NOT EXISTS food_emission_factors (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER NOT NULL UNIQUE,
    value NUMERIC(10, 6) NOT NULL, -- Emissions per kilogram
    unit VARCHAR(255) NOT NULL DEFAULT 'kg CO2e/kg',
    CONSTRAINT fk_food_emission_factors_entities
        FOREIGN KEY (entity_id) REFERENCES food_entities (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table to store food consumption data
CREATE TABLE IF NOT EXISTS food_consumption (
    id SERIAL PRIMARY KEY,
    entity VARCHAR(255) NOT NULL,
    dairy_consumption_grams NUMERIC(10, 6) NOT NULL
);

-- Shopping Schema
-- Table to store the main categories of products.
-- e.g., 'Food & Beverages', 'Home & Living'
CREATE TABLE IF NOT EXISTS shopping_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Table to store subcategories, linked to a main category.
-- e.g., 'General Merchandise', 'Groceries & Beverages'
CREATE TABLE IF NOT EXISTS shopping_subcategories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL,
    product_count INTEGER DEFAULT 0,
    average_emission NUMERIC(10, 6),
    CONSTRAINT fk_shopping_subcategories_categories
        FOREIGN KEY (category_id) REFERENCES shopping_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE (name, category_id)
);

-- Table to store the specific entities (products or services).
-- e.g., 'Dog and Cat Food Manufacturing'
CREATE TABLE IF NOT EXISTS shopping_entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    subcategory_id INTEGER NOT NULL,
    CONSTRAINT fk_shopping_entities_subcategories
        FOREIGN KEY (subcategory_id) REFERENCES shopping_subcategories (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table to store emission factors for each entity.
-- This table is designed to hold Malaysia-specific emission data.
CREATE TABLE IF NOT EXISTS shopping_emission_factors (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER NOT NULL UNIQUE,
    value NUMERIC(10, 6),
    unit VARCHAR(255),
    CONSTRAINT fk_shopping_emission_factors_entities
        FOREIGN KEY (entity_id) REFERENCES shopping_entities (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Performance Indexes
-- Indexes on foreign key columns for better join performance
CREATE INDEX IF NOT EXISTS idx_vehicle_size_category_id ON vehicle_size(category_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_size_fuel_id ON vehicle_size(fuel_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_emission_category_id ON vehicle_emission_factor(category_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_emission_size_id ON vehicle_emission_factor(size_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_emission_fuel_id ON vehicle_emission_factor(fuel_id);
CREATE INDEX IF NOT EXISTS idx_public_transport_fuel_id ON public_transport(fuel_id);
CREATE INDEX IF NOT EXISTS idx_household_factors_category_id ON household_factors(category_id);
CREATE INDEX IF NOT EXISTS idx_household_factors_region_id ON household_factors(region_id);
CREATE INDEX IF NOT EXISTS idx_food_subcategories_category_id ON food_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_food_entities_subcategory_id ON food_entities(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_food_emission_factors_entity_id ON food_emission_factors(entity_id);
CREATE INDEX IF NOT EXISTS idx_shopping_subcategories_category_id ON shopping_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_shopping_entities_subcategory_id ON shopping_entities(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_shopping_emission_factors_entity_id ON shopping_emission_factors(entity_id);

-- Indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_food_entities_name ON food_entities(name);
CREATE INDEX IF NOT EXISTS idx_food_categories_name ON food_categories(name);
CREATE INDEX IF NOT EXISTS idx_shopping_entities_name ON shopping_entities(name);
CREATE INDEX IF NOT EXISTS idx_shopping_categories_name ON shopping_categories(name);
CREATE INDEX IF NOT EXISTS idx_vehicle_category_name ON vehicle_category(category_name);
CREATE INDEX IF NOT EXISTS idx_fuel_type_name ON fuel_type(fuel_name);
CREATE INDEX IF NOT EXISTS idx_region_name ON region(region_name);

-- Comments for better documentation
COMMENT ON TABLE vehicle_category IS 'Vehicle type classification table';
COMMENT ON TABLE fuel_type IS 'Fuel type reference table';
COMMENT ON TABLE vehicle_size IS 'Vehicle size specifications linked to category and fuel type';
COMMENT ON TABLE vehicle_emission_factor IS 'Emission factors for private vehicles by category, size, and fuel type';
COMMENT ON TABLE public_transport IS 'Emission factors for public transportation methods';
COMMENT ON TABLE region IS 'Geographic regions for household factors';
COMMENT ON TABLE household_factor_category IS 'Categories of household emission factors';
COMMENT ON TABLE household_factors IS 'Household emission factors by category and region';
COMMENT ON TABLE food_categories IS 'Main food categories (e.g., Food & Beverages)';
COMMENT ON TABLE food_subcategories IS 'Food subcategories (e.g., Fruits, Vegetables, Red Meats)';
COMMENT ON TABLE food_entities IS 'Specific food products (e.g., Apples, Beef steak)';
COMMENT ON TABLE food_emission_factors IS 'Carbon emission factors for food entities';
COMMENT ON TABLE shopping_categories IS 'Main shopping categories (e.g., Food & Beverages, Home & Living)';
COMMENT ON TABLE shopping_subcategories IS 'Shopping subcategories (e.g., General Merchandise, Groceries)';
COMMENT ON TABLE shopping_entities IS 'Specific shopping entities (products or services)';
COMMENT ON TABLE shopping_emission_factors IS 'Carbon emission factors for shopping entities';
