-- Travel Schema
-- 车辆分类表 Vehicle Type Classification Table
CREATE TABLE vehicle_category (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL
);

-- 燃料类型表 Fuel Type Table
CREATE TABLE fuel_type (
    id SERIAL PRIMARY KEY,
    fuel_name VARCHAR(50) NOT NULL
);

-- 车辆尺寸表 Vehicle Size Table
CREATE TABLE vehicle_size (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    size_name VARCHAR(50) NOT NULL,
    description TEXT,
    fuel_id INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES vehicle_category(id),
    FOREIGN KEY (fuel_id) REFERENCES fuel_type(id)
);

-- 车辆排放因子表 Vehicle Emission Factor Table (Only contains private vehicle)
CREATE TABLE vehicle_emission_factor (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    size_id INT NOT NULL,
    fuel_id INT NOT NULL,
    emission_value DECIMAL(10,6) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES vehicle_category(id),
    FOREIGN KEY (size_id) REFERENCES vehicle_size(id),
    FOREIGN KEY (fuel_id) REFERENCES fuel_type(id)
);

-- 公共交通表 Public Transport Table
CREATE TABLE public_transport (
    id SERIAL PRIMARY KEY,
    transport_type VARCHAR(50) NOT NULL,
    emission_factor DECIMAL(10,6) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    fuel_id INT NOT NULL,
    FOREIGN KEY (fuel_id) REFERENCES fuel_type(id)
);

-- 家庭因素数据库表结构 Household Factors Database Schema

-- 地区表 Region Table
CREATE TABLE region (
    id SERIAL PRIMARY KEY,
    region_name VARCHAR(50) NOT NULL
);

-- 家庭因素分类表 Household Factor Category Table
CREATE TABLE household_factor_category (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL
);

-- 家庭因素表 Household Factors Table
CREATE TABLE household_factors (
    id SERIAL PRIMARY KEY,
    factor_name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    region_id INT,
    unit VARCHAR(20) NOT NULL,
    emission_factor DECIMAL(10,6) NOT NULL,
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES household_factor_category(id),
    FOREIGN KEY (region_id) REFERENCES region(id)
);

CREATE TABLE food_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- Table to store subcategories, linked to a main category.
-- e.g., 'Fruits', 'Vegetables', 'Red Meats'
CREATE TABLE food_subcategories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  product_count INTEGER DEFAULT 0,
  average_emission NUMERIC(10, 6),
  CONSTRAINT fk_food_subcategories_categories
    FOREIGN KEY (category_id) REFERENCES food_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (name, category_id)
);

-- Table to store the specific food entities (products).
-- e.g., 'Apples', 'Beef steak'
CREATE TABLE food_entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  subcategory_id INT NOT NULL,
  CONSTRAINT fk_food_entities_subcategories
    FOREIGN KEY (subcategory_id) REFERENCES food_subcategories (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table to store emission factors for each food entity.
-- The unit is assumed to be 'kg CO2e/kg' based on the source file.
CREATE TABLE food_emission_factors (
  id SERIAL PRIMARY KEY,
  entity_id INT NOT NULL UNIQUE,
  value DECIMAL(10, 6) NOT NULL, -- Emissions per kilogram
  unit VARCHAR(255) NOT NULL DEFAULT 'kg CO2e/kg',
  CONSTRAINT fk_food_emission_factors_entities
    FOREIGN KEY (entity_id) REFERENCES food_entities (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table to store the main categories of products.
-- e.g., 'Food & Beverages', 'Home & Living'
CREATE TABLE shopping_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- Table to store subcategories, linked to a main category.
-- e.g., 'General Merchandise', 'Groceries & Beverages'
CREATE TABLE shopping_subcategories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  product_count INTEGER DEFAULT 0,
  average_emission NUMERIC(10, 6),
  CONSTRAINT fk_shopping_subcategories_categories
    FOREIGN KEY (category_id) REFERENCES shopping_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (name, category_id)
);

-- Table to store the specific entities (products or services).
-- e.g., 'Dog and Cat Food Manufacturing'
CREATE TABLE shopping_entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  subcategory_id INT NOT NULL,
  CONSTRAINT fk_shopping_entities_subcategories
    FOREIGN KEY (subcategory_id) REFERENCES shopping_subcategories (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table to store emission factors for each entity.
-- This table is designed to hold Malaysia-specific emission data.
CREATE TABLE shopping_emission_factors (
  id SERIAL PRIMARY KEY,
  entity_id INT NOT NULL UNIQUE,
  value DECIMAL(10, 6),
  unit VARCHAR(255),
  CONSTRAINT fk_shopping_emission_factors_entities
    FOREIGN KEY (entity_id) REFERENCES shopping_entities (id) ON DELETE CASCADE ON UPDATE CASCADE
);