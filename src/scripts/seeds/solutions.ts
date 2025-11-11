import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { SolutionsService } from 'src/modules/solutions/services/solutions.service';
import { CreateSolutionDto } from 'src/modules/solutions/dtos/request/create-solution.dto';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import * as fs from 'fs';
import * as path from 'path';

interface SolutionJsonData {
  slug: string;
  icon?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  isPublished?: boolean;
  isFeatured?: boolean;
  featuredImage?: string;
  order?: number;
  languageCode: string;
  translateTo: string[];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const solutionsService = app.get(SolutionsService);
  const translateService = app.get(TranslateService);

  try {
    // Read solutions.json file
    const solutionsJsonPath = path.join(process.cwd(), 'solutions.json');
    const solutionsJsonContent = fs.readFileSync(solutionsJsonPath, 'utf-8');
    const solutionsData: SolutionJsonData[] = JSON.parse(solutionsJsonContent);

    console.log(`📖 Found ${solutionsData.length} solutions to seed`);

    // Check if any solutions already exist
    const existingSolutions = await solutionsService.findAll({ page: 1, limit: 1 });
    if (existingSolutions.pagination.total > 0) {
      console.log('⚠️  Solutions already exist in the database.');
      console.log('   If you want to re-seed, please delete existing solutions first.');
      await app.close();
      return;
    }

    // Process each solution
    for (let i = 0; i < solutionsData.length; i++) {
      const solutionData = solutionsData[i];
      console.log(`\n[${i + 1}/${solutionsData.length}] Processing: ${solutionData.name}`);

      // Normalize language codes (ensure lowercase and trimmed)
      let normalizedLanguageCode = (solutionData.languageCode || 'en').toLowerCase().trim();
      // Validate language code - must be exactly 2 lowercase letters
      if (!/^[a-z]{2}$/.test(normalizedLanguageCode)) {
        console.warn(`   ⚠️  Invalid language code "${solutionData.languageCode}", defaulting to "en"`);
        normalizedLanguageCode = 'en';
      }

      // Normalize and filter translateTo array - only keep valid 2-letter codes
      const normalizedTranslateTo = (solutionData.translateTo || [])
        .map((code) => code.toLowerCase().trim())
        .filter((code) => /^[a-z]{2}$/.test(code));

      // Create CreateSolutionDto
      const createSolutionDto: CreateSolutionDto = {
        slug: solutionData.slug,
        icon: solutionData.icon,
        name: solutionData.name,
        description: solutionData.description,
        shortDescription: solutionData.shortDescription,
        meta: solutionData.meta,
        isPublished: solutionData.isPublished ?? true,
        isFeatured: solutionData.isFeatured ?? false,
        featuredImage: solutionData.featuredImage,
        order: solutionData.order ?? 0,
        languageCode: normalizedLanguageCode,
        translateTo: normalizedTranslateTo,
      };

      try {
        // Create solution without translation (we'll handle translation separately)
        const createSolutionDtoWithoutTranslation: CreateSolutionDto = {
          ...createSolutionDto,
          translateTo: [], // Don't translate in create, we'll do it manually
        };
        const createdSolution = await solutionsService.create(createSolutionDtoWithoutTranslation);
        console.log(`   ✅ Created solution: ${createdSolution.slug}`);

        // Translate if needed
        if (createSolutionDto.translateTo.length > 0) {
          // Filter out invalid language codes and the default language code
          const translateTo = createSolutionDto.translateTo.filter((code) => {
            // Validate: must be exactly 2 lowercase letters
            return /^[a-z]{2}$/.test(code) && code !== createSolutionDto.languageCode;
          });

          if (translateTo.length > 0) {
            console.log(`   ⏳ Translating to [${translateTo.join(', ')}]...`);
            try {
              await translateService.translateToLanguages(
                translateTo,
                TranslationEventTypes.solution,
                createdSolution.id,
                {
                  name: createSolutionDto.name,
                  description: createSolutionDto.description,
                  shortDescription: createSolutionDto.shortDescription,
                  meta: createSolutionDto.meta,
                },
              );
              console.log(`   ✅ Translation completed for [${translateTo.join(', ')}]`);
            } catch (translationError) {
              const errorMessage =
                translationError instanceof Error ? translationError.message : String(translationError);
              console.error(`   ⚠️  Translation failed: ${errorMessage}`);
              // Continue even if translation fails
            }
          } else if (createSolutionDto.translateTo.length > 0) {
            console.log(`   ⚠️  No valid language codes to translate to (filtered out invalid codes)`);
          }
        }

        // Wait a bit to avoid overwhelming the translation service
        if (i < solutionsData.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error creating solution ${solutionData.slug}:`, errorMessage);
        // Continue with next solution instead of crashing
        console.log(`   ⚠️  Skipping to next solution...`);
        continue;
      }
    }

    console.log('\n✅ All solutions seeded successfully with translations!');
  } catch (error) {
    console.error('❌ Error seeding solutions:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Execute seeder
bootstrap()
  .then(() => {
    console.log('\n🎉 Solutions seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Solutions seeding failed:', error);
    process.exit(1);
  });
