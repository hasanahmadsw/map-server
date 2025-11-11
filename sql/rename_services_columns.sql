-- SQL Migration Script: Rename Service and ServiceTranslation columns to snake_case
-- Run this script to update existing database columns to match the new entity definitions
-- 
-- IMPORTANT: Run this script in a transaction and verify the results before committing
-- Backup your database before running this script!

BEGIN;

-- ============================================
-- RENAME COLUMNS IN 'services' TABLE
-- ============================================

-- Rename isPublished to is_published (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'isPublished'
    ) THEN
        ALTER TABLE services RENAME COLUMN "isPublished" TO is_published;
    END IF;
END $$;

-- Rename isFeatured to is_featured (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'isFeatured'
    ) THEN
        ALTER TABLE services RENAME COLUMN "isFeatured" TO is_featured;
    END IF;
END $$;

-- Rename featuredImage to featured_image (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'featuredImage'
    ) THEN
        ALTER TABLE services RENAME COLUMN "featuredImage" TO featured_image;
    END IF;
END $$;

-- Rename viewCount to view_count (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'viewCount'
    ) THEN
        ALTER TABLE services RENAME COLUMN "viewCount" TO view_count;
    END IF;
END $$;

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE services RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE services RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- ============================================
-- RENAME COLUMNS IN 'services_translations' TABLE
-- ============================================

-- Rename serviceId to service_id (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services_translations' AND column_name = 'serviceId'
    ) THEN
        ALTER TABLE services_translations RENAME COLUMN "serviceId" TO service_id;
    END IF;
END $$;

-- Rename languageCode to language_code (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services_translations' AND column_name = 'languageCode'
    ) THEN
        ALTER TABLE services_translations RENAME COLUMN "languageCode" TO language_code;
    END IF;
END $$;

-- Rename shortDescription to short_description (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services_translations' AND column_name = 'shortDescription'
    ) THEN
        ALTER TABLE services_translations RENAME COLUMN "shortDescription" TO short_description;
    END IF;
END $$;

-- Note: is_default already exists, no need to rename

-- Rename subServices to sub_services (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services_translations' AND column_name = 'subServices'
    ) THEN
        ALTER TABLE services_translations RENAME COLUMN "subServices" TO sub_services;
    END IF;
END $$;

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services_translations' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE services_translations RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services_translations' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE services_translations RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- ============================================
-- UPDATE JOIN TABLE COLUMNS
-- ============================================

-- Update solution_services join table columns
DO $$
BEGIN
    -- Rename serviceId to service_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'solution_services' 
        AND column_name = 'serviceId'
    ) THEN
        ALTER TABLE solution_services RENAME COLUMN "serviceId" TO service_id;
    END IF;
    
    -- Rename solutionId to solution_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'solution_services' 
        AND column_name = 'solutionId'
    ) THEN
        ALTER TABLE solution_services RENAME COLUMN "solutionId" TO solution_id;
    END IF;
END $$;

-- Update project_services join table columns
DO $$
BEGIN
    -- Rename serviceId to service_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'project_services' 
        AND column_name = 'serviceId'
    ) THEN
        ALTER TABLE project_services RENAME COLUMN "serviceId" TO service_id;
    END IF;
    
    -- Rename projectId to project_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'project_services' 
        AND column_name = 'projectId'
    ) THEN
        ALTER TABLE project_services RENAME COLUMN "projectId" TO project_id;
    END IF;
END $$;

-- ============================================
-- VERIFY CHANGES
-- ============================================

-- Verify services table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

-- Verify services_translations table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'services_translations' 
ORDER BY ordinal_position;

-- ============================================
-- COMMIT OR ROLLBACK
-- ============================================

-- If everything looks good, commit the transaction:
-- COMMIT;

-- If there are issues, rollback:
-- ROLLBACK;

-- Note: TypeORM will automatically handle foreign key constraints and indexes
-- when you run migrations. The column renames above preserve all constraints.

