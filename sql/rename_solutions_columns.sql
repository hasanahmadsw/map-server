-- SQL Migration Script: Rename Solution and SolutionTranslation columns to snake_case
-- Run this script to update existing database columns to match the new entity definitions
-- 
-- IMPORTANT: Run this script in a transaction and verify the results before committing
-- Backup your database before running this script!

BEGIN;

-- ============================================
-- RENAME COLUMNS IN 'solutions' TABLE
-- ============================================

-- Rename isPublished to is_published (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions' AND column_name = 'isPublished'
    ) THEN
        ALTER TABLE solutions RENAME COLUMN "isPublished" TO is_published;
    END IF;
END $$;

-- Rename isFeatured to is_featured (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions' AND column_name = 'isFeatured'
    ) THEN
        ALTER TABLE solutions RENAME COLUMN "isFeatured" TO is_featured;
    END IF;
END $$;

-- Rename featuredImage to featured_image (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions' AND column_name = 'featuredImage'
    ) THEN
        ALTER TABLE solutions RENAME COLUMN "featuredImage" TO featured_image;
    END IF;
END $$;

-- Rename viewCount to view_count (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions' AND column_name = 'viewCount'
    ) THEN
        ALTER TABLE solutions RENAME COLUMN "viewCount" TO view_count;
    END IF;
END $$;

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE solutions RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE solutions RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- ============================================
-- RENAME COLUMNS IN 'solutions_translations' TABLE
-- ============================================

-- Rename solutionId to solution_id (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions_translations' AND column_name = 'solutionId'
    ) THEN
        ALTER TABLE solutions_translations RENAME COLUMN "solutionId" TO solution_id;
    END IF;
END $$;

-- Rename languageCode to language_code (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions_translations' AND column_name = 'languageCode'
    ) THEN
        ALTER TABLE solutions_translations RENAME COLUMN "languageCode" TO language_code;
    END IF;
END $$;

-- Rename shortDescription to short_description (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions_translations' AND column_name = 'shortDescription'
    ) THEN
        ALTER TABLE solutions_translations RENAME COLUMN "shortDescription" TO short_description;
    END IF;
END $$;

-- Note: is_default already exists, no need to rename

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions_translations' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE solutions_translations RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solutions_translations' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE solutions_translations RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- ============================================
-- UPDATE JOIN TABLE COLUMNS
-- ============================================

-- Update solution_services join table columns (if not already updated by services migration)
DO $$
BEGIN
    -- Rename solutionId to solution_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'solution_services' 
        AND column_name = 'solutionId'
    ) THEN
        ALTER TABLE solution_services RENAME COLUMN "solutionId" TO solution_id;
    END IF;
    
    -- Rename serviceId to service_id if it exists (may have been updated by services migration)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'solution_services' 
        AND column_name = 'serviceId'
    ) THEN
        ALTER TABLE solution_services RENAME COLUMN "serviceId" TO service_id;
    END IF;
END $$;

-- Update solution_projects join table columns
DO $$
BEGIN
    -- Rename solutionId to solution_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'solution_projects' 
        AND column_name = 'solutionId'
    ) THEN
        ALTER TABLE solution_projects RENAME COLUMN "solutionId" TO solution_id;
    END IF;
    
    -- Rename projectId to project_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'solution_projects' 
        AND column_name = 'projectId'
    ) THEN
        ALTER TABLE solution_projects RENAME COLUMN "projectId" TO project_id;
    END IF;
END $$;

-- ============================================
-- VERIFY CHANGES
-- ============================================

-- Verify solutions table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'solutions' 
ORDER BY ordinal_position;

-- Verify solutions_translations table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'solutions_translations' 
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

