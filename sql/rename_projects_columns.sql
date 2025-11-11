-- SQL Migration Script: Rename Project and ProjectTranslation columns to snake_case
-- Run this script to update existing database columns to match the new entity definitions
-- 
-- IMPORTANT: Run this script in a transaction and verify the results before committing
-- Backup your database before running this script!

BEGIN;

-- ============================================
-- RENAME COLUMNS IN 'projects' TABLE
-- ============================================

-- Rename isPublished to is_published (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'isPublished'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "isPublished" TO is_published;
    END IF;
END $$;

-- Rename isFeatured to is_featured (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'isFeatured'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "isFeatured" TO is_featured;
    END IF;
END $$;

-- Rename featuredImage to featured_image (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'featuredImage'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "featuredImage" TO featured_image;
    END IF;
END $$;

-- Rename viewCount to view_count (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'viewCount'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "viewCount" TO view_count;
    END IF;
END $$;

-- Rename clientName to client_name (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'clientName'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "clientName" TO client_name;
    END IF;
END $$;

-- Rename projectUrl to project_url (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'projectUrl'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "projectUrl" TO project_url;
    END IF;
END $$;

-- Rename githubUrl to github_url (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'githubUrl'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "githubUrl" TO github_url;
    END IF;
END $$;

-- Rename startDate to start_date (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'startDate'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "startDate" TO start_date;
    END IF;
END $$;

-- Rename endDate to end_date (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'endDate'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "endDate" TO end_date;
    END IF;
END $$;

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE projects RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- ============================================
-- RENAME COLUMNS IN 'projects_translations' TABLE
-- ============================================

-- Rename projectId to project_id (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects_translations' AND column_name = 'projectId'
    ) THEN
        ALTER TABLE projects_translations RENAME COLUMN "projectId" TO project_id;
    END IF;
END $$;

-- Rename languageCode to language_code (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects_translations' AND column_name = 'languageCode'
    ) THEN
        ALTER TABLE projects_translations RENAME COLUMN "languageCode" TO language_code;
    END IF;
END $$;

-- Rename shortDescription to short_description (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects_translations' AND column_name = 'shortDescription'
    ) THEN
        ALTER TABLE projects_translations RENAME COLUMN "shortDescription" TO short_description;
    END IF;
END $$;

-- Note: is_default already exists, no need to rename

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects_translations' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE projects_translations RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects_translations' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE projects_translations RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- ============================================
-- UPDATE JOIN TABLE COLUMNS
-- ============================================

-- Update project_services join table columns
DO $$
BEGIN
    -- Rename projectId to project_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'project_services' 
        AND column_name = 'projectId'
    ) THEN
        ALTER TABLE project_services RENAME COLUMN "projectId" TO project_id;
    END IF;
    
    -- Rename serviceId to service_id if it exists (may have been updated by services migration)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'project_services' 
        AND column_name = 'serviceId'
    ) THEN
        ALTER TABLE project_services RENAME COLUMN "serviceId" TO service_id;
    END IF;
END $$;

-- Update project_solutions join table columns (note: this table is also referenced by solutions)
DO $$
BEGIN
    -- Rename projectId to project_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'project_solutions' 
        AND column_name = 'projectId'
    ) THEN
        ALTER TABLE project_solutions RENAME COLUMN "projectId" TO project_id;
    END IF;
    
    -- Rename solutionId to solution_id if it exists (may have been updated by solutions migration)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'project_solutions' 
        AND column_name = 'solutionId'
    ) THEN
        ALTER TABLE project_solutions RENAME COLUMN "solutionId" TO solution_id;
    END IF;
END $$;

-- Update solution_projects join table columns (this is the inverse of project_solutions)
-- Note: solution_projects and project_solutions might be the same table, but we'll handle both cases
DO $$
BEGIN
    -- Rename projectId to project_id if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'solution_projects' 
        AND column_name = 'projectId'
    ) THEN
        ALTER TABLE solution_projects RENAME COLUMN "projectId" TO project_id;
    END IF;
    
    -- Rename solutionId to solution_id if it exists (may have been updated by solutions migration)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'solution_projects' 
        AND column_name = 'solutionId'
    ) THEN
        ALTER TABLE solution_projects RENAME COLUMN "solutionId" TO solution_id;
    END IF;
END $$;

-- ============================================
-- VERIFY CHANGES
-- ============================================

-- Verify projects table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Verify projects_translations table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects_translations' 
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

