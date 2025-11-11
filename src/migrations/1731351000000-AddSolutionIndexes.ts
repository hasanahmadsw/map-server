import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSolutionIndexes1731351000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- =========================
      -- solutions
      -- =========================

      -- Sorting the general lists: order ASC then created_at DESC (with id to ensure stability)
      CREATE INDEX IF NOT EXISTS idx_solutions_order_created
        ON public.solutions ("order" ASC, created_at DESC, id ASC);

      -- Composite index when filtering on is_published with the same order
      CREATE INDEX IF NOT EXISTS idx_solutions_published_order_created
        ON public.solutions (is_published, "order" ASC, created_at DESC, id ASC);

      -- Partial index for general pages (only published) with temporal order
      CREATE INDEX IF NOT EXISTS idx_solutions_created_published_only
        ON public.solutions (created_at DESC, id ASC)
        WHERE is_published = true;

      -- In case you use featured frequently
      CREATE INDEX IF NOT EXISTS idx_solutions_featured_order_created
        ON public.solutions (is_featured, "order" ASC, created_at DESC, id ASC);

      -- In case you have a "Most Viewed" tab
      CREATE INDEX IF NOT EXISTS idx_solutions_view_count_desc
        ON public.solutions (view_count DESC, id ASC);

      -- (Optional) BRIN index for wide temporal scanning
      -- CREATE INDEX IF NOT EXISTS brin_solutions_created_at
      --   ON public.solutions USING brin (created_at);

      -- =========================
      -- solutions_translations
      -- =========================

      -- Speed up the JOIN on the solution
      CREATE INDEX IF NOT EXISTS idx_solution_translations_solution_id
        ON public.solutions_translations (solution_id);

      -- Quick access to the translation of a specific language for a specific solution
      CREATE INDEX IF NOT EXISTS idx_solution_translations_lang_solution
        ON public.solutions_translations (language_code, solution_id);

      -- Quick access to the default translation for each solution
      CREATE INDEX IF NOT EXISTS idx_solution_translations_default_per_solution
        ON public.solutions_translations (solution_id)
        WHERE is_default = true;

      -- Search ILIKE on the name using pg_trgm
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX IF NOT EXISTS idx_solution_translations_name_trgm
        ON public.solutions_translations USING gin (name gin_trgm_ops);

      -- (Optional) Search text on the description and summary if you are using them in the search
      -- CREATE INDEX IF NOT EXISTS idx_solution_translations_description_trgm
      --   ON public.solutions_translations USING gin (description gin_trgm_ops);
      -- CREATE INDEX IF NOT EXISTS idx_solution_translations_short_desc_trgm
      --   ON public.solutions_translations USING gin (short_description gin_trgm_ops);

        -- (Optional) In case there are filters on the JSONB fields
      -- CREATE INDEX IF NOT EXISTS idx_solution_translations_meta_gin
      --   ON public.solutions_translations USING gin (meta);

      -- =========================
      -- Junction tables (JOIN faster)
      -- =========================

      -- solution_services
      CREATE INDEX IF NOT EXISTS idx_solution_services_solution_id
        ON public.solution_services (solution_id);
      CREATE INDEX IF NOT EXISTS idx_solution_services_service_id
        ON public.solution_services (service_id);
      CREATE INDEX IF NOT EXISTS idx_solution_services_solution_service
        ON public.solution_services (solution_id, service_id);

      -- solution_projects
      CREATE INDEX IF NOT EXISTS idx_solution_projects_solution_id
        ON public.solution_projects (solution_id);
      CREATE INDEX IF NOT EXISTS idx_solution_projects_project_id
        ON public.solution_projects (project_id);
      CREATE INDEX IF NOT EXISTS idx_solution_projects_solution_project
        ON public.solution_projects (solution_id, project_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Junction tables
      DROP INDEX IF EXISTS idx_solution_projects_solution_project;
      DROP INDEX IF EXISTS idx_solution_projects_project_id;
      DROP INDEX IF EXISTS idx_solution_projects_solution_id;

      DROP INDEX IF EXISTS idx_solution_services_solution_service;
      DROP INDEX IF EXISTS idx_solution_services_service_id;
      DROP INDEX IF EXISTS idx_solution_services_solution_id;

      -- solutions_translations
      DROP INDEX IF EXISTS idx_solution_translations_meta_gin;
      DROP INDEX IF EXISTS idx_solution_translations_short_desc_trgm;
      DROP INDEX IF EXISTS idx_solution_translations_description_trgm;
      DROP INDEX IF EXISTS idx_solution_translations_name_trgm;
      DROP INDEX IF EXISTS idx_solution_translations_default_per_solution;
      DROP INDEX IF EXISTS idx_solution_translations_lang_solution;
      DROP INDEX IF EXISTS idx_solution_translations_solution_id;

      -- solutions
      DROP INDEX IF EXISTS idx_solutions_view_count_desc;
      DROP INDEX IF EXISTS idx_solutions_featured_order_created;
      DROP INDEX IF EXISTS idx_solutions_created_published_only;
      DROP INDEX IF EXISTS idx_solutions_published_order_created;
      DROP INDEX IF EXISTS idx_solutions_order_created;
      -- DROP INDEX IF EXISTS brin_solutions_created_at;
    `);
  }
}
