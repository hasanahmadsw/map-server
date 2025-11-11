import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceIndexes1731350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- =========================
      -- services
      -- =========================

      -- Sorting the general lists (order ASC then created_at DESC) + support published
      CREATE INDEX IF NOT EXISTS idx_services_order_created
        ON public.services ("order" ASC, created_at DESC, id ASC);

      CREATE INDEX IF NOT EXISTS idx_services_published_order_created
        ON public.services (is_published, "order" ASC, created_at DESC, id ASC);

      -- Partial common index for frontend pages (only published)
      CREATE INDEX IF NOT EXISTS idx_services_created_published_only
        ON public.services (created_at DESC, id ASC)
        WHERE is_published = true;

      -- If you use featured frequently (featured lists)
      CREATE INDEX IF NOT EXISTS idx_services_featured_order_created
        ON public.services (is_featured, "order" ASC, created_at DESC, id ASC);

      -- In case you have a "Most Viewed" tab
      CREATE INDEX IF NOT EXISTS idx_services_view_count_desc
        ON public.services (view_count DESC, id ASC);

      -- =========================
      -- services_translations
      -- =========================

      -- Speed up the JOIN on the service
      CREATE INDEX IF NOT EXISTS idx_service_translations_service_id
        ON public.services_translations (service_id);

      -- Quick access to the translation of a specific language for a specific service
      CREATE INDEX IF NOT EXISTS idx_service_translations_lang_service
        ON public.services_translations (language_code, service_id);

      -- Quick access to the default translation for each service
      CREATE INDEX IF NOT EXISTS idx_service_translations_default_per_service
        ON public.services_translations (service_id)
        WHERE is_default = true;

      -- Search ILIKE on the name using pg_trgm
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX IF NOT EXISTS idx_service_translations_name_trgm
        ON public.services_translations USING gin (name gin_trgm_ops);

      -- (Optional) Search text on the description and summary if you are using them in the search
      -- CREATE INDEX IF NOT EXISTS idx_service_translations_description_trgm
      --   ON public.services_translations USING gin (description gin_trgm_ops);
      -- CREATE INDEX IF NOT EXISTS idx_service_translations_short_desc_trgm
      --   ON public.services_translations USING gin (short_description gin_trgm_ops);

      -- (Optional) In case there are filters on the JSONB fields
      -- CREATE INDEX IF NOT EXISTS idx_service_translations_meta_gin
      --   ON public.services_translations USING gin (meta);
      -- CREATE INDEX IF NOT EXISTS idx_service_translations_sub_services_gin
      --   ON public.services_translations USING gin (sub_services);

      -- =========================
      -- Junction tables (JOIN faster)
      -- =========================

      -- solution_services
      CREATE INDEX IF NOT EXISTS idx_solution_services_service_id
        ON public.solution_services (service_id);
      CREATE INDEX IF NOT EXISTS idx_solution_services_solution_id
        ON public.solution_services (solution_id);
      -- Composite index that gives planner more flexibility
      CREATE INDEX IF NOT EXISTS idx_solution_services_solution_service
        ON public.solution_services (solution_id, service_id);

      -- project_services
      CREATE INDEX IF NOT EXISTS idx_project_services_service_id
        ON public.project_services (service_id);
      CREATE INDEX IF NOT EXISTS idx_project_services_project_id
        ON public.project_services (project_id);
      CREATE INDEX IF NOT EXISTS idx_project_services_project_service
        ON public.project_services (project_id, service_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Junction tables
      DROP INDEX IF EXISTS idx_project_services_project_service;
      DROP INDEX IF EXISTS idx_project_services_project_id;
      DROP INDEX IF EXISTS idx_project_services_service_id;

      DROP INDEX IF EXISTS idx_solution_services_solution_service;
      DROP INDEX IF EXISTS idx_solution_services_solution_id;
      DROP INDEX IF EXISTS idx_solution_services_service_id;

      -- services_translations
      DROP INDEX IF EXISTS idx_service_translations_sub_services_gin;
      DROP INDEX IF EXISTS idx_service_translations_meta_gin;
      DROP INDEX IF EXISTS idx_service_translations_short_desc_trgm;
      DROP INDEX IF EXISTS idx_service_translations_description_trgm;
      DROP INDEX IF EXISTS idx_service_translations_name_trgm;
      DROP INDEX IF EXISTS idx_service_translations_default_per_service;
      DROP INDEX IF EXISTS idx_service_translations_lang_service;
      DROP INDEX IF EXISTS idx_service_translations_service_id;

      -- services
      DROP INDEX IF EXISTS idx_services_view_count_desc;
      DROP INDEX IF EXISTS idx_services_featured_order_created;
      DROP INDEX IF EXISTS idx_services_created_published_only;
      DROP INDEX IF EXISTS idx_services_published_order_created;
      DROP INDEX IF EXISTS idx_services_order_created;
    `);
  }
}
