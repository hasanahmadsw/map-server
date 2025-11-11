-- SQL Migration Script: Rename Staff and StaffTranslation columns to snake_case
-- Run this script to update existing database columns to match the new entity definitions
-- 
-- IMPORTANT: Run this script in a transaction and verify the results before committing
-- Backup your database before running this script!

BEGIN;

-- ============================================
-- RENAME COLUMNS IN 'staff' TABLE
-- ============================================

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE staff RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE staff RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- Note: password_changed_at already exists, no need to rename

-- ============================================
-- RENAME COLUMNS IN 'staff_translations' TABLE
-- ============================================

-- Rename staffId to staff_id (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_translations' AND column_name = 'staffId'
    ) THEN
        ALTER TABLE staff_translations RENAME COLUMN "staffId" TO staff_id;
    END IF;
END $$;

-- Rename languageCode to language_code (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_translations' AND column_name = 'languageCode'
    ) THEN
        ALTER TABLE staff_translations RENAME COLUMN "languageCode" TO language_code;
    END IF;
END $$;

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_translations' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE staff_translations RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_translations' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE staff_translations RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- Note: is_default already exists, no need to rename

-- ============================================
-- UPDATE UNIQUE CONSTRAINT
-- ============================================

-- Drop and recreate the unique constraint with new column names
DO $$
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UQ_STAFF_LANGUAGE'
    ) THEN
        ALTER TABLE staff_translations DROP CONSTRAINT IF EXISTS UQ_STAFF_LANGUAGE;
    END IF;
    
    -- Create the new constraint with snake_case column names
    -- Only if both columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_translations' AND column_name = 'staff_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_translations' AND column_name = 'language_code'
    ) THEN
        ALTER TABLE staff_translations 
        ADD CONSTRAINT UQ_STAFF_LANGUAGE UNIQUE (staff_id, language_code);
    END IF;
END $$;

-- ============================================
-- VERIFY CHANGES
-- ============================================

-- Verify staff table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- Verify staff_translations table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'staff_translations' 
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

