import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { ArticlesService } from 'src/modules/articles/services/articles.service';
import { CreateArticleDto } from 'src/modules/articles/dtos/request/create-article.dto';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { DataSource } from 'typeorm';
import { StaffEntity } from 'src/modules/staff/entities/staff.entity';
import { StaffRole } from 'src/modules/staff/enums/staff-role.enums';
import * as fs from 'fs';
import * as path from 'path';

interface ArticleJsonData {
  slug: string;
  image?: string;
  name: string;
  content: string;
  excerpt?: string;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  isPublished?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  topics?: string[];
  languageCode: string;
  translateTo: string[];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const articlesService = app.get(ArticlesService);
  const translateService = app.get(TranslateService);
  const dataSource = app.get(DataSource);

  try {
    // Read articles.json file
    const articlesJsonPath = path.join(process.cwd(), 'articles.json');
    const articlesJsonContent = fs.readFileSync(articlesJsonPath, 'utf-8');
    const articlesData: ArticleJsonData[] = JSON.parse(articlesJsonContent);

    console.log(`📖 Found ${articlesData.length} articles to seed`);

    // Check if any articles already exist
    const existingArticles = await articlesService.findAll({ page: 1, limit: 1 });
    if (existingArticles.pagination.total > 0) {
      console.log('⚠️  Articles already exist in the database.');
      console.log('   If you want to re-seed, please delete existing articles first.');
      await app.close();
      return;
    }

    // Get a staff member to use as author (prefer AUTHOR role, fall back to ADMIN, then SUPERADMIN)
    const staffRepository = dataSource.getRepository(StaffEntity);
    let author = await staffRepository.findOne({
      where: { role: StaffRole.AUTHOR },
    });

    if (!author) {
      author = await staffRepository.findOne({
        where: { role: StaffRole.ADMIN },
      });
    }

    if (!author) {
      author = await staffRepository.findOne({
        where: { role: StaffRole.SUPERADMIN },
      });
    }

    if (!author) {
      console.error('❌ No staff members found. Please run the staff seeder first.');
      await app.close();
      return;
    }

    console.log(`👤 Using author: ${author.name} (${author.email})`);

    // Process each article
    for (let i = 0; i < articlesData.length; i++) {
      const articleData = articlesData[i];
      console.log(`\n[${i + 1}/${articlesData.length}] Processing: ${articleData.name}`);

      // Normalize language codes (ensure lowercase and trimmed)
      let normalizedLanguageCode = (articleData.languageCode || 'en').toLowerCase().trim();
      // Validate language code - must be exactly 2 lowercase letters
      if (!/^[a-z]{2}$/.test(normalizedLanguageCode)) {
        console.warn(`   ⚠️  Invalid language code "${articleData.languageCode}", defaulting to "en"`);
        normalizedLanguageCode = 'en';
      }

      // Normalize and filter translateTo array - only keep valid 2-letter codes
      const normalizedTranslateTo = (articleData.translateTo || [])
        .map((code) => code.toLowerCase().trim())
        .filter((code) => /^[a-z]{2}$/.test(code));

      // Create CreateArticleDto
      const createArticleDto: CreateArticleDto = {
        slug: articleData.slug,
        image: articleData.image,
        name: articleData.name,
        content: articleData.content,
        excerpt: articleData.excerpt,
        meta: articleData.meta,
        isPublished: articleData.isPublished ?? true,
        isFeatured: articleData.isFeatured ?? false,
        tags: articleData.tags ?? [],
        topics: articleData.topics ?? [],
        languageCode: normalizedLanguageCode,
        translateTo: normalizedTranslateTo,
      };

      try {
        // Create article without translation (we'll handle translation separately)
        const createArticleDtoWithoutTranslation: CreateArticleDto = {
          ...createArticleDto,
          translateTo: [], // Don't translate in create, we'll do it manually
        };
        const createdArticle = await articlesService.create(author, createArticleDtoWithoutTranslation);
        console.log(`   ✅ Created article: ${createdArticle.slug}`);

        // Translate if needed
        if (createArticleDto.translateTo.length > 0) {
          // Filter out invalid language codes and the default language code
          const translateTo = createArticleDto.translateTo.filter((code) => {
            // Validate: must be exactly 2 lowercase letters
            return /^[a-z]{2}$/.test(code) && code !== createArticleDto.languageCode;
          });

          if (translateTo.length > 0) {
            console.log(`   ⏳ Translating to [${translateTo.join(', ')}]...`);
            try {
              await translateService.translateToLanguages(
                translateTo,
                TranslationEventTypes.article,
                createdArticle.id,
                {
                  name: createArticleDto.name,
                  content: createArticleDto.content,
                  excerpt: createArticleDto.excerpt,
                  meta: createArticleDto.meta,
                },
              );
              console.log(`   ✅ Translation completed for [${translateTo.join(', ')}]`);
            } catch (translationError) {
              const errorMessage =
                translationError instanceof Error ? translationError.message : String(translationError);
              console.error(`   ⚠️  Translation failed: ${errorMessage}`);
              // Continue even if translation fails
            }
          } else if (createArticleDto.translateTo.length > 0) {
            console.log(`   ⚠️  No valid language codes to translate to (filtered out invalid codes)`);
          }
        }

        // Wait a bit to avoid overwhelming the translation service
        if (i < articlesData.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error creating article ${articleData.slug}:`, errorMessage);
        // Continue with next article instead of crashing
        console.log(`   ⚠️  Skipping to next article...`);
        continue;
      }
    }

    console.log('\n✅ All articles seeded successfully with translations!');
  } catch (error) {
    console.error('❌ Error seeding articles:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Execute seeder
bootstrap()
  .then(() => {
    console.log('\n🎉 Articles seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Articles seeding failed:', error);
    process.exit(1);
  });
