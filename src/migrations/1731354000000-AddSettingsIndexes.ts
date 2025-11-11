import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsIndexes1731354000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- =========================
      -- settings
      -- =========================

      -- In most cases there is one row, but we add indexes to ensure fast access if the system expands

      -- Index for fast search by name or default language
      CREATE INDEX IF NOT EXISTS idx_settings_site_name
        ON public.settings (site_name);

      CREATE INDEX IF NOT EXISTS idx_settings_default_language
        ON public.settings (default_language);

      -- Indexes on the structured fields (meta/social/analytics/contact/customScripts)
      CREATE INDEX IF NOT EXISTS idx_settings_meta_gin
        ON public.settings USING gin (meta);

      CREATE INDEX IF NOT EXISTS idx_settings_social_gin
        ON public.settings USING gin (social);

      CREATE INDEX IF NOT EXISTS idx_settings_analytics_gin
        ON public.settings USING gin (analytics);

      CREATE INDEX IF NOT EXISTS idx_settings_contact_gin
        ON public.settings USING gin (contact);

      CREATE INDEX IF NOT EXISTS idx_settings_custom_scripts_gin
        ON public.settings USING gin (custom_scripts);

      -- Temporal order (in case there are multiple settings in the future)
      CREATE INDEX IF NOT EXISTS idx_settings_created_desc
        ON public.settings (created_at DESC, id ASC);

      -- =========================
      -- settings_translations
      -- =========================

      -- Speed up the access by language
      CREATE INDEX IF NOT EXISTS idx_settings_translations_language
        ON public.settings_translations (language_code);

      -- Search ILIKE on the site name or description
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX IF NOT EXISTS idx_settings_translations_site_name_trgm
        ON public.settings_translations USING gin (site_name gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_settings_translations_description_trgm
        ON public.settings_translations USING gin (site_description gin_trgm_ops);

          -- Index on meta (for search or filtering by keys)
      CREATE INDEX IF NOT EXISTS idx_settings_translations_meta_gin
        ON public.settings_translations USING gin (meta);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- settings_translations
      DROP INDEX IF EXISTS idx_settings_translations_meta_gin;
      DROP INDEX IF EXISTS idx_settings_translations_description_trgm;
      DROP INDEX IF EXISTS idx_settings_translations_site_name_trgm;
      DROP INDEX IF EXISTS idx_settings_translations_language;

      -- settings
      DROP INDEX IF EXISTS idx_settings_created_desc;
      DROP INDEX IF EXISTS idx_settings_custom_scripts_gin;
      DROP INDEX IF EXISTS idx_settings_contact_gin;
      DROP INDEX IF EXISTS idx_settings_analytics_gin;
      DROP INDEX IF EXISTS idx_settings_social_gin;
      DROP INDEX IF EXISTS idx_settings_meta_gin;
      DROP INDEX IF EXISTS idx_settings_default_language;
      DROP INDEX IF EXISTS idx_settings_site_name;
    `);
  }
}
