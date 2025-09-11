import { pgTable, serial, varchar, text, jsonb, decimal, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums

// ========= Food Data Schema =========

export const foodCategories = pgTable('food_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
});

export const foodSubcategories = pgTable('food_subcategories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: integer('category_id').notNull().references(() => foodCategories.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
});

export const foodEntities = pgTable('food_entities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  subcategoryId: integer('subcategory_id').notNull().references(() => foodSubcategories.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
});

export const foodEmissionFactors = pgTable('food_emission_factors', {
  id: serial('id').primaryKey(),
  entityId: integer('entity_id').notNull().unique().references(() => foodEntities.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
  value: decimal('value', { precision: 10, scale: 6 }).notNull(),
  unit: varchar('unit', { length: 255 }).notNull().default('kg CO2e/kg'),
});

// ========= Shopping Data Schema =========

export const shoppingCategories = pgTable('shopping_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
});

export const shoppingSubcategories = pgTable('shopping_subcategories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: integer('category_id').notNull().references(() => shoppingCategories.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
});

export const shoppingEntities = pgTable('shopping_entities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  subcategoryId: integer('subcategory_id').notNull().references(() => shoppingSubcategories.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
});

export const shoppingEmissionFactors = pgTable('shopping_emission_factors', {
  id: serial('id').primaryKey(),
  entityId: integer('entity_id').notNull().unique().references(() => shoppingEntities.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
  value: decimal('value', { precision: 10, scale: 6 }),
  unit: varchar('unit', { length: 255 }),
});

// ========= Travel Schema =========

export const vehicleCategory = pgTable('vehicle_category', {
  id: serial('id').primaryKey(),
  categoryName: varchar('category_name', { length: 50 }).notNull(),
});

export const fuelType = pgTable('fuel_type', {
  id: serial('id').primaryKey(),
  fuelName: varchar('fuel_name', { length: 50 }).notNull(),
});

export const vehicleSize = pgTable('vehicle_size', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => vehicleCategory.id),
  sizeName: varchar('size_name', { length: 50 }).notNull(),
  description: text('description'),
  fuelId: integer('fuel_id').notNull().references(() => fuelType.id),
});

export const vehicleEmissionFactor = pgTable('vehicle_emission_factor', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => vehicleCategory.id),
  sizeId: integer('size_id').notNull().references(() => vehicleSize.id),
  fuelId: integer('fuel_id').notNull().references(() => fuelType.id),
  emissionValue: decimal('emission_value', { precision: 10, scale: 6 }).notNull(),
  unit: varchar('unit', { length: 10 }).notNull(),
});

export const publicTransport = pgTable('public_transport', {
  id: serial('id').primaryKey(),
  transportType: varchar('transport_type', { length: 50 }).notNull(),
  emissionFactor: decimal('emission_factor', { precision: 10, scale: 6 }).notNull(),
  unit: varchar('unit', { length: 10 }).notNull(),
  fuelId: integer('fuel_id').notNull().references(() => fuelType.id),
});

// ========= Household Schema =========

export const region = pgTable('region', {
  id: serial('id').primaryKey(),
  regionName: varchar('region_name', { length: 50 }).notNull(),
});

export const householdFactorCategory = pgTable('household_factor_category', {
  id: serial('id').primaryKey(),
  categoryName: varchar('category_name', { length: 50 }).notNull(),
});

export const householdFactors = pgTable('household_factors', {
  id: serial('id').primaryKey(),
  factorName: varchar('factor_name', { length: 100 }).notNull(),
  categoryId: integer('category_id').notNull().references(() => householdFactorCategory.id),
  regionId: integer('region_id').references(() => region.id),
  unit: varchar('unit', { length: 20 }).notNull(),
  emissionFactor: decimal('emission_factor', { precision: 10, scale: 6 }).notNull(),
  description: text('description'),
});

// ========= Main Calculations Table =========
// Removed - calculations are no longer stored

// ========= Relations =========

// Food relations
export const foodCategoriesRelations = relations(foodCategories, ({ many }) => ({
  subcategories: many(foodSubcategories),
}));

export const foodSubcategoriesRelations = relations(foodSubcategories, ({ one, many }) => ({
  category: one(foodCategories, {
    fields: [foodSubcategories.categoryId],
    references: [foodCategories.id],
  }),
  entities: many(foodEntities),
}));

export const foodEntitiesRelations = relations(foodEntities, ({ one, many }) => ({
  subcategory: one(foodSubcategories, {
    fields: [foodEntities.subcategoryId],
    references: [foodSubcategories.id],
  }),
  emissionFactor: one(foodEmissionFactors, {
    fields: [foodEntities.id],
    references: [foodEmissionFactors.entityId],
  }),
}));

// Shopping relations
export const shoppingCategoriesRelations = relations(shoppingCategories, ({ many }) => ({
  subcategories: many(shoppingSubcategories),
}));

export const shoppingSubcategoriesRelations = relations(shoppingSubcategories, ({ one, many }) => ({
  category: one(shoppingCategories, {
    fields: [shoppingSubcategories.categoryId],
    references: [shoppingCategories.id],
  }),
  entities: many(shoppingEntities),
}));

export const shoppingEntitiesRelations = relations(shoppingEntities, ({ one, many }) => ({
  subcategory: one(shoppingSubcategories, {
    fields: [shoppingEntities.subcategoryId],
    references: [shoppingSubcategories.id],
  }),
  emissionFactor: one(shoppingEmissionFactors, {
    fields: [shoppingEntities.id],
    references: [shoppingEmissionFactors.entityId],
  }),
}));

// Travel relations
export const vehicleCategoryRelations = relations(vehicleCategory, ({ many }) => ({
  sizes: many(vehicleSize),
  emissionFactors: many(vehicleEmissionFactor),
}));

export const fuelTypeRelations = relations(fuelType, ({ many }) => ({
  vehicleSizes: many(vehicleSize),
  vehicleEmissionFactors: many(vehicleEmissionFactor),
  publicTransports: many(publicTransport),
}));

export const vehicleSizeRelations = relations(vehicleSize, ({ one, many }) => ({
  category: one(vehicleCategory, {
    fields: [vehicleSize.categoryId],
    references: [vehicleCategory.id],
  }),
  fuel: one(fuelType, {
    fields: [vehicleSize.fuelId],
    references: [fuelType.id],
  }),
  emissionFactors: many(vehicleEmissionFactor),
}));

// Household relations
export const regionRelations = relations(region, ({ many }) => ({
  householdFactors: many(householdFactors),
}));

export const householdFactorCategoryRelations = relations(householdFactorCategory, ({ many }) => ({
  factors: many(householdFactors),
}));

export const householdFactorsRelations = relations(householdFactors, ({ one }) => ({
  category: one(householdFactorCategory, {
    fields: [householdFactors.categoryId],
    references: [householdFactorCategory.id],
  }),
  region: one(region, {
    fields: [householdFactors.regionId],
    references: [region.id],
  }),
}));
