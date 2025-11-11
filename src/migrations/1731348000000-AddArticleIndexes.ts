import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArticleIndexes1731348000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_published_created_desc
        ON public.articles (is_published, created_at DESC, id ASC);

      CREATE INDEX IF NOT EXISTS idx_articles_created_desc_published_only
        ON public.articles (created_at DESC, id ASC) WHERE is_published = true;

      CREATE INDEX IF NOT EXISTS idx_articles_featured_created_desc
        ON public.articles (is_featured, created_at DESC, id ASC);

      CREATE INDEX IF NOT EXISTS idx_articles_author_id
        ON public.articles (author_id);

      CREATE INDEX IF NOT EXISTS idx_articles_tags_gin
        ON public.articles USING gin (tags);

      CREATE INDEX IF NOT EXISTS idx_articles_topics_gin
        ON public.articles USING gin (topics);

      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      CREATE INDEX IF NOT EXISTS idx_article_translations_article_id
        ON public.articles_translations (article_id);

      CREATE INDEX IF NOT EXISTS idx_article_translations_lang_article
        ON public.articles_translations (language_code, article_id);

      CREATE INDEX IF NOT EXISTS idx_article_translations_default_per_article
        ON public.articles_translations (article_id) WHERE is_default = true;

      CREATE INDEX IF NOT EXISTS idx_article_translations_name_trgm
        ON public.articles_translations USING gin (name gin_trgm_ops);

      -- اختياري:
      -- CREATE INDEX IF NOT EXISTS brin_articles_created_at
      --   ON public.articles USING brin (created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_article_translations_name_trgm;

      DROP INDEX IF EXISTS idx_article_translations_default_per_article;

      DROP INDEX IF EXISTS idx_article_translations_lang_article;

      DROP INDEX IF EXISTS idx_article_translations_article_id;

      DROP INDEX IF EXISTS idx_articles_topics_gin;

      DROP INDEX IF EXISTS idx_articles_tags_gin;

      DROP INDEX IF EXISTS idx_articles_author_id;

      DROP INDEX IF EXISTS idx_articles_featured_created_desc;

      DROP INDEX IF EXISTS idx_articles_created_desc_published_only;

      DROP INDEX IF EXISTS idx_articles_published_created_desc;

      -- DROP INDEX IF EXISTS brin_articles_created_at;
    `);
  }
}
