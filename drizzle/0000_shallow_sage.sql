CREATE TABLE IF NOT EXISTS "carbon_emission_factors" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"subcategory" varchar(100),
	"name" varchar(255) NOT NULL,
	"emission_factor" numeric(10, 6) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"description" text,
	"malaysian_context" text,
	"source" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "food_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "food_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "food_consumption" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity" varchar(255) NOT NULL,
	"dairy_consumption_grams" numeric(10, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "food_emission_factors" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_id" integer NOT NULL,
	"value" numeric(10, 6) NOT NULL,
	"unit" varchar(255) DEFAULT 'kg CO2e/kg' NOT NULL,
	CONSTRAINT "food_emission_factors_entity_id_unique" UNIQUE("entity_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "food_entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subcategory_id" integer NOT NULL,
	CONSTRAINT "food_entities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "food_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" integer NOT NULL,
	"product_count" integer DEFAULT 0,
	"average_emission" numeric(10, 6)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fuel_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"fuel_name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "household_factor_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "household_factors" (
	"id" serial PRIMARY KEY NOT NULL,
	"factor_name" varchar(100) NOT NULL,
	"category_id" integer NOT NULL,
	"region_id" integer,
	"unit" varchar(20) NOT NULL,
	"emission_factor" numeric(10, 6) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public_transport" (
	"id" serial PRIMARY KEY NOT NULL,
	"transport_type" varchar(50) NOT NULL,
	"emission_factor" numeric(10, 6) NOT NULL,
	"unit" varchar(10) NOT NULL,
	"fuel_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recommendations_kb" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"context" text,
	"impact_level" varchar(20) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"cost_impact" varchar(20) NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"embedding" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "region" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shopping_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "shopping_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shopping_emission_factors" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_id" integer NOT NULL,
	"value" numeric(10, 6),
	"unit" varchar(255),
	CONSTRAINT "shopping_emission_factors_entity_id_unique" UNIQUE("entity_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shopping_entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subcategory_id" integer NOT NULL,
	CONSTRAINT "shopping_entities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shopping_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" integer NOT NULL,
	"product_count" integer DEFAULT 0,
	"average_emission" numeric(10, 6)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_emission_factor" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"size_id" integer NOT NULL,
	"fuel_id" integer NOT NULL,
	"emission_value" numeric(10, 6) NOT NULL,
	"unit" varchar(10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicle_size" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"size_name" varchar(50) NOT NULL,
	"description" text,
	"fuel_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "food_emission_factors" ADD CONSTRAINT "food_emission_factors_entity_id_food_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "food_entities"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "food_entities" ADD CONSTRAINT "food_entities_subcategory_id_food_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "food_subcategories"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "food_subcategories" ADD CONSTRAINT "food_subcategories_category_id_food_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "food_categories"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "household_factors" ADD CONSTRAINT "household_factors_category_id_household_factor_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "household_factor_category"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "household_factors" ADD CONSTRAINT "household_factors_region_id_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_transport" ADD CONSTRAINT "public_transport_fuel_id_fuel_type_id_fk" FOREIGN KEY ("fuel_id") REFERENCES "fuel_type"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shopping_emission_factors" ADD CONSTRAINT "shopping_emission_factors_entity_id_shopping_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "shopping_entities"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shopping_entities" ADD CONSTRAINT "shopping_entities_subcategory_id_shopping_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "shopping_subcategories"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shopping_subcategories" ADD CONSTRAINT "shopping_subcategories_category_id_shopping_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "shopping_categories"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_emission_factor" ADD CONSTRAINT "vehicle_emission_factor_category_id_vehicle_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "vehicle_category"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_emission_factor" ADD CONSTRAINT "vehicle_emission_factor_size_id_vehicle_size_id_fk" FOREIGN KEY ("size_id") REFERENCES "vehicle_size"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_emission_factor" ADD CONSTRAINT "vehicle_emission_factor_fuel_id_fuel_type_id_fk" FOREIGN KEY ("fuel_id") REFERENCES "fuel_type"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_size" ADD CONSTRAINT "vehicle_size_category_id_vehicle_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "vehicle_category"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehicle_size" ADD CONSTRAINT "vehicle_size_fuel_id_fuel_type_id_fk" FOREIGN KEY ("fuel_id") REFERENCES "fuel_type"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
