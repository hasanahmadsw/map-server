import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { ServicesService } from 'src/modules/services/services/services.service';
import { CreateServiceDto } from 'src/modules/services/dtos/request/create-service.dto';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import * as fs from 'fs';
import * as path from 'path';

interface ServiceJsonData {
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
  subServices?: Array<{
    name: string;
    description?: string;
  }>;
  isPublished?: boolean;
  isFeatured?: boolean;
  featuredImage?: string;
  order?: number;
  solutionIds?: number[];
  languageCode: string;
  translateTo: string[];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const servicesService = app.get(ServicesService);
  const translateService = app.get(TranslateService);

  try {
    // Read services.json file
    const servicesJsonPath = path.join(process.cwd(), 'services.json');
    const servicesJsonContent = fs.readFileSync(servicesJsonPath, 'utf-8');
    const servicesData: ServiceJsonData[] = JSON.parse(servicesJsonContent);

    console.log(`📖 Found ${servicesData.length} services to seed`);

    // Check if any services already exist
    // const existingServices = await servicesService.findAll({ page: 1, limit: 1 });
    // if (existingServices.pagination.total > 0) {
    //   console.log('⚠️  Services already exist in the database.');
    //   console.log('   If you want to re-seed, please delete existing services first.');
    //   await app.close();
    //   return;
    // }

    // Process each service
    for (let i = 0; i < servicesData.length; i++) {
      const serviceData = servicesData[i];
      console.log(`\n[${i + 1}/${servicesData.length}] Processing: ${serviceData.name}`);

      // Transform subServices: map 'name' to 'title' to match the DTO interface
      const subServices = serviceData.subServices?.map((subService) => ({
        title: subService.name,
        description: subService.description,
      }));

      // Normalize language codes (ensure lowercase and trimmed)
      let normalizedLanguageCode = (serviceData.languageCode || 'en').toLowerCase().trim();
      // Validate language code - must be exactly 2 lowercase letters
      if (!/^[a-z]{2}$/.test(normalizedLanguageCode)) {
        console.warn(`   ⚠️  Invalid language code "${serviceData.languageCode}", defaulting to "en"`);
        normalizedLanguageCode = 'en';
      }

      // Normalize and filter translateTo array - only keep valid 2-letter codes
      const normalizedTranslateTo = (serviceData.translateTo || [])
        .map((code) => code.toLowerCase().trim())
        .filter((code) => /^[a-z]{2}$/.test(code));

      // Create CreateServiceDto
      const createServiceDto: CreateServiceDto = {
        slug: serviceData.slug,
        icon: serviceData.icon,
        name: serviceData.name,
        description: serviceData.description,
        shortDescription: serviceData.shortDescription,
        meta: serviceData.meta,
        subServices: subServices,
        isPublished: serviceData.isPublished ?? true,
        isFeatured: serviceData.isFeatured ?? false,
        featuredImage: serviceData.featuredImage,
        order: serviceData.order ?? 0,
        solutionIds: serviceData.solutionIds,
        languageCode: normalizedLanguageCode,
        translateTo: normalizedTranslateTo,
      };

      try {
        // Create service without translation (we'll handle translation separately)
        const createServiceDtoWithoutTranslation: CreateServiceDto = {
          ...createServiceDto,
          translateTo: [], // Don't translate in create, we'll do it manually
        };
        const createdService = await servicesService.create(createServiceDtoWithoutTranslation);
        console.log(`   ✅ Created service: ${createdService.slug}`);

        // Translate if needed
        if (createServiceDto.translateTo.length > 0) {
          // Filter out invalid language codes and the default language code
          const translateTo = createServiceDto.translateTo.filter((code) => {
            // Validate: must be exactly 2 lowercase letters
            return /^[a-z]{2}$/.test(code) && code !== createServiceDto.languageCode;
          });

          if (translateTo.length > 0) {
            console.log(`   ⏳ Translating to [${translateTo.join(', ')}]...`);
            try {
              await translateService.translateToLanguages(
                translateTo,
                TranslationEventTypes.service,
                createdService.id,
                {
                  name: createServiceDto.name,
                  description: createServiceDto.description,
                  shortDescription: createServiceDto.shortDescription,
                  meta: createServiceDto.meta,
                  subServices: createServiceDto.subServices,
                },
              );
              console.log(`   ✅ Translation completed for [${translateTo.join(', ')}]`);
            } catch (translationError) {
              const errorMessage =
                translationError instanceof Error ? translationError.message : String(translationError);
              console.error(`   ⚠️  Translation failed: ${errorMessage}`);
              // Continue even if translation fails
            }
          } else if (createServiceDto.translateTo.length > 0) {
            console.log(`   ⚠️  No valid language codes to translate to (filtered out invalid codes)`);
          }
        }

        // Wait a bit to avoid overwhelming the translation service
        if (i < servicesData.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error creating service ${serviceData.slug}:`, errorMessage);
        // Continue with next service instead of crashing
        console.log(`   ⚠️  Skipping to next service...`);
        continue;
      }
    }

    console.log('\n✅ All services seeded successfully with translations!');
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Execute seeder
bootstrap()
  .then(() => {
    console.log('\n🎉 Services seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Services seeding failed:', error);
    process.exit(1);
  });
