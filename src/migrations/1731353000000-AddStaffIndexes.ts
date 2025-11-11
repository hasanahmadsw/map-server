import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStaffIndexes1731353000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- =========================
      -- staff
      -- =========================

      -- Sorting the general lists: order ASC then created_at DESC (with id to ensure stability)
      CREATE INDEX IF NOT EXISTS idx_staff_created_desc
        ON public.staff (created_at DESC, id ASC);

      -- Composite index when filtering on role with the same order
      CREATE INDEX IF NOT EXISTS idx_staff_role_created_desc
        ON public.staff (role, created_at DESC, id ASC);

      -- Queries that depend on password changes (sessions, permissions...)
      CREATE INDEX IF NOT EXISTS idx_staff_password_changed_at
        ON public.staff (password_changed_at);

      -- Search ILIKE on the name using pg_trgm (optional but practical in admin panels)
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX IF NOT EXISTS idx_staff_name_trgm
        ON public.staff USING gin (name gin_trgm_ops);

      -- Note: email is unique from the Entity, so we don't add an additional index.

      -- =========================
      -- staff_translations
      -- =========================

      -- Speed up the JOIN on the staff
      CREATE INDEX IF NOT EXISTS idx_staff_translations_staff_id
        ON public.staff_translations (staff_id);

      -- Quick access to the translation of a specific language for a specific staff
      CREATE INDEX IF NOT EXISTS idx_staff_translations_lang_staff
        ON public.staff_translations (language_code, staff_id);

      -- Quick access to the default translation for each staff
      CREATE INDEX IF NOT EXISTS idx_staff_translations_default_per_staff
        ON public.staff_translations (staff_id)
        WHERE is_default = true;

        -- Search ILIKE on the name and bio using pg_trgm
      CREATE INDEX IF NOT EXISTS idx_staff_translations_name_trgm
        ON public.staff_translations USING gin (name gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_staff_translations_bio_trgm
        ON public.staff_translations USING gin (bio gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- staff_translations
      DROP INDEX IF EXISTS idx_staff_translations_bio_trgm;
      DROP INDEX IF EXISTS idx_staff_translations_name_trgm;
      DROP INDEX IF EXISTS idx_staff_translations_default_per_staff;
      DROP INDEX IF EXISTS idx_staff_translations_lang_staff;
      DROP INDEX IF EXISTS idx_staff_translations_staff_id;

      -- staff
      DROP INDEX IF EXISTS idx_staff_name_trgm;
      DROP INDEX IF EXISTS idx_staff_password_changed_at;
      DROP INDEX IF EXISTS idx_staff_role_created_desc;
      DROP INDEX IF EXISTS idx_staff_created_desc;
    `);
  }
}
