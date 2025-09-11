-- ========= Food Data Schema =========

CREATE TABLE food_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE food_subcategories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL REFERENCES food_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE (name, category_id)
);
CREATE INDEX ON food_subcategories (category_id);

CREATE TABLE food_entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  subcategory_id INT NOT NULL REFERENCES food_subcategories(id) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX ON food_entities (subcategory_id);

CREATE TABLE food_emission_factors (
  id SERIAL PRIMARY KEY,
  entity_id INT NOT NULL UNIQUE REFERENCES food_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  value DECIMAL(10, 6) NOT NULL,
  unit VARCHAR(255) NOT NULL DEFAULT 'kg CO2e/kg'
);
CREATE INDEX ON food_emission_factors (entity_id);


-- ========= Shopping Data Schema =========

CREATE TABLE shopping_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE shopping_subcategories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL REFERENCES shopping_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE (name, category_id)
);
CREATE INDEX ON shopping_subcategories (category_id);

CREATE TABLE shopping_entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  subcategory_id INT NOT NULL REFERENCES shopping_subcategories(id) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX ON shopping_entities (subcategory_id);

CREATE TABLE shopping_emission_factors (
  id SERIAL PRIMARY KEY,
  entity_id INT NOT NULL UNIQUE REFERENCES shopping_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  value DECIMAL(10, 6) DEFAULT NULL,
  unit VARCHAR(255) DEFAULT NULL
);
CREATE INDEX ON shopping_emission_factors (entity_id);


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
