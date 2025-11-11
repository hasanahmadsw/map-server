-- SQL Migration Script: Rename Setting and SettingTranslation columns to snake_case
-- Run this script to update existing database columns to match the new entity definitions
-- 
-- IMPORTANT: Run this script in a transaction and verify the results before committing
-- Backup your database before running this script!

BEGIN;

-- ============================================
-- RENAME COLUMNS IN 'settings' TABLE
-- ============================================

-- Rename siteName to site_name (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'siteName'
    ) THEN
        ALTER TABLE settings RENAME COLUMN "siteName" TO site_name;
    END IF;
END $$;

-- Rename siteDescription to site_description (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'siteDescription'
    ) THEN
        ALTER TABLE settings RENAME COLUMN "siteDescription" TO site_description;
    END IF;
END $$;

-- Rename siteLogo to site_logo (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'siteLogo'
    ) THEN
        ALTER TABLE settings RENAME COLUMN "siteLogo" TO site_logo;
    END IF;
END $$;

-- Rename siteDarkLogo to site_dark_logo (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'siteDarkLogo'
    ) THEN
        ALTER TABLE settings RENAME COLUMN "siteDarkLogo" TO site_dark_logo;
    END IF;
END $$;

-- Rename siteFavicon to site_favicon (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'siteFavicon'
    ) THEN
        ALTER TABLE settings RENAME COLUMN "siteFavicon" TO site_favicon;
    END IF;
END $$;

-- Rename defaultLanguage to default_language (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'defaultLanguage'
    ) THEN
        ALTER TABLE settings RENAME COLUMN "defaultLanguage" TO default_language;
    END IF;
END $$;

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE settings RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE settings RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- ============================================
-- RENAME COLUMNS IN 'settings_translations' TABLE
-- ============================================

-- Rename languageCode to language_code (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings_translations' AND column_name = 'languageCode'
    ) THEN
        ALTER TABLE settings_translations RENAME COLUMN "languageCode" TO language_code;
    END IF;
END $$;

-- Rename siteName to site_name (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings_translations' AND column_name = 'siteName'
    ) THEN
        ALTER TABLE settings_translations RENAME COLUMN "siteName" TO site_name;
    END IF;
END $$;

-- Rename siteDescription to site_description (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings_translations' AND column_name = 'siteDescription'
    ) THEN
        ALTER TABLE settings_translations RENAME COLUMN "siteDescription" TO site_description;
    END IF;
END $$;

-- Rename siteLogo to site_logo (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings_translations' AND column_name = 'siteLogo'
    ) THEN
        ALTER TABLE settings_translations RENAME COLUMN "siteLogo" TO site_logo;
    END IF;
END $$;

-- Rename siteDarkLogo to site_dark_logo (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings_translations' AND column_name = 'siteDarkLogo'
    ) THEN
        ALTER TABLE settings_translations RENAME COLUMN "siteDarkLogo" TO site_dark_logo;
    END IF;
END $$;

-- Rename createdAt to created_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings_translations' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE settings_translations RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- Rename updatedAt to updated_at (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings_translations' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE settings_translations RENAME COLUMN "updatedAt" TO updated_at;
    END IF;
END $$;

-- ============================================
-- UPDATE UNIQUE CONSTRAINT
-- ============================================

-- Drop and recreate the unique constraint with new column name
DO $$
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UQ_SETTING_LANGUAGE'
    ) THEN
        ALTER TABLE settings_translations DROP CONSTRAINT IF EXISTS UQ_SETTING_LANGUAGE;
    END IF;
    
    -- Create the new constraint with snake_case column name
    -- Only if the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings_translations' AND column_name = 'language_code'
    ) THEN
        ALTER TABLE settings_translations 
        ADD CONSTRAINT UQ_SETTING_LANGUAGE UNIQUE (language_code);
    END IF;
END $$;

-- ============================================
-- VERIFY CHANGES
-- ============================================

-- Verify settings table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'settings' 
ORDER BY ordinal_position;

-- Verify settings_translations table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'settings_translations' 
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

