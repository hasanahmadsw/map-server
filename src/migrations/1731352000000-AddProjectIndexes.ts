import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectIndexes1731352000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- =========================
      -- projects
      -- =========================

      -- Sorting the general lists: order ASC then created_at DESC (with id to ensure stability)
      CREATE INDEX IF NOT EXISTS idx_projects_order_created
        ON public.projects ("order" ASC, created_at DESC, id ASC);

      -- Composite index when filtering on is_published with the same order
      CREATE INDEX IF NOT EXISTS idx_projects_published_order_created
        ON public.projects (is_published, "order" ASC, created_at DESC, id ASC);

      -- Partial index for general pages (only published) with temporal order
      CREATE INDEX IF NOT EXISTS idx_projects_created_published_only
        ON public.projects (created_at DESC, id ASC)
        WHERE is_published = true;

      -- In case you use featured frequently
      CREATE INDEX IF NOT EXISTS idx_projects_featured_order_created
        ON public.projects (is_featured, "order" ASC, created_at DESC, id ASC);

      -- In case you have a "Most Viewed" tab
      CREATE INDEX IF NOT EXISTS idx_projects_view_count_desc
        ON public.projects (view_count DESC, id ASC);

      -- Temporal range (start_date / end_date) for temporal queries
      CREATE INDEX IF NOT EXISTS idx_projects_start_date
        ON public.projects (start_date);
      CREATE INDEX IF NOT EXISTS idx_projects_end_date
        ON public.projects (end_date);

      -- JSONB for technologies (for queries @> and ? and ?| and ?&)
      CREATE INDEX IF NOT EXISTS idx_projects_technologies_gin
        ON public.projects USING gin (technologies);

      -- External links (optional when filtering/sorting on them)
      -- CREATE INDEX IF NOT EXISTS idx_projects_client_name ON public.projects (client_name);
      -- CREATE INDEX IF NOT EXISTS idx_projects_project_url ON public.projects (project_url);
      -- CREATE INDEX IF NOT EXISTS idx_projects_github_url  ON public.projects (github_url);

      -- (Optional) BRIN index for wide temporal scanning
      -- CREATE INDEX IF NOT EXISTS brin_projects_created_at ON public.projects USING brin (created_at);

      -- =========================
      -- projects_translations
      -- =========================

      -- Speed up the JOIN on the project
      CREATE INDEX IF NOT EXISTS idx_project_translations_project_id
        ON public.projects_translations (project_id);

      -- Quick access to the translation of a specific language for a specific project
      CREATE INDEX IF NOT EXISTS idx_project_translations_lang_project
        ON public.projects_translations (language_code, project_id);

          -- Quick access to the default translation for each project
      CREATE INDEX IF NOT EXISTS idx_project_translations_default_per_project
        ON public.projects_translations (project_id)
        WHERE is_default = true;

      -- Search ILIKE on the name using pg_trgm
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX IF NOT EXISTS idx_project_translations_name_trgm
        ON public.projects_translations USING gin (name gin_trgm_ops);

      -- (Optional) Search text on the description and summary if you are using them in the search
      -- CREATE INDEX IF NOT EXISTS idx_project_translations_description_trgm
      --   ON public.projects_translations USING gin (description gin_trgm_ops);
      -- CREATE INDEX IF NOT EXISTS idx_project_translations_short_desc_trgm
      --   ON public.projects_translations USING gin (short_description gin_trgm_ops);

      -- (Optional) In case there are filters on the JSONB fields
      -- CREATE INDEX IF NOT EXISTS idx_project_translations_meta_gin
      --   ON public.projects_translations USING gin (meta);
      -- CREATE INDEX IF NOT EXISTS idx_project_translations_challenges_gin
      --   ON public.projects_translations USING gin (challenges);
      -- CREATE INDEX IF NOT EXISTS idx_project_translations_results_gin
      --   ON public.projects_translations USING gin (results);

      -- =========================
        -- Junction tables (JOIN faster)
      -- =========================

      -- project_services
      CREATE INDEX IF NOT EXISTS idx_project_services_project_id
        ON public.project_services (project_id);
      CREATE INDEX IF NOT EXISTS idx_project_services_service_id
        ON public.project_services (service_id);
      CREATE INDEX IF NOT EXISTS idx_project_services_project_service
        ON public.project_services (project_id, service_id);

      -- project_solutions
      CREATE INDEX IF NOT EXISTS idx_project_solutions_project_id
        ON public.project_solutions (project_id);
      CREATE INDEX IF NOT EXISTS idx_project_solutions_solution_id
        ON public.project_solutions (solution_id);
      CREATE INDEX IF NOT EXISTS idx_project_solutions_project_solution
        ON public.project_solutions (project_id, solution_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Junction tables
      DROP INDEX IF EXISTS idx_project_solutions_project_solution;
      DROP INDEX IF EXISTS idx_project_solutions_solution_id;
      DROP INDEX IF EXISTS idx_project_solutions_project_id;

      DROP INDEX IF EXISTS idx_project_services_project_service;
      DROP INDEX IF EXISTS idx_project_services_service_id;
      DROP INDEX IF EXISTS idx_project_services_project_id;

      -- projects_translations
      DROP INDEX IF EXISTS idx_project_translations_results_gin;
      DROP INDEX IF EXISTS idx_project_translations_challenges_gin;
      DROP INDEX IF EXISTS idx_project_translations_meta_gin;
      DROP INDEX IF EXISTS idx_project_translations_short_desc_trgm;
      DROP INDEX IF EXISTS idx_project_translations_description_trgm;
      DROP INDEX IF EXISTS idx_project_translations_name_trgm;
      DROP INDEX IF EXISTS idx_project_translations_default_per_project;
      DROP INDEX IF EXISTS idx_project_translations_lang_project;
      DROP INDEX IF EXISTS idx_project_translations_project_id;

      -- projects
      DROP INDEX IF EXISTS idx_projects_technologies_gin;
      DROP INDEX IF EXISTS idx_projects_end_date;
      DROP INDEX IF EXISTS idx_projects_start_date;
      DROP INDEX IF EXISTS idx_projects_view_count_desc;
      DROP INDEX IF EXISTS idx_projects_featured_order_created;
      DROP INDEX IF EXISTS idx_projects_created_published_only;
      DROP INDEX IF EXISTS idx_projects_published_order_created;
      DROP INDEX IF EXISTS idx_projects_order_created;
      -- DROP INDEX IF EXISTS brin_projects_created_at;
    `);
  }
}
