import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from 'src/app.module';
import { LanguageEntity } from 'src/modules/languages/entities/language.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const languageRepository = queryRunner.manager.getRepository(LanguageEntity);

    // Check if any languages already exists
    const existingLanguage = await languageRepository.count();

    if (existingLanguage > 0) {
      console.error('❌ Language already exist in the database. Seeding aborted.');
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      await app.close();
      return;
    }

    const language: Partial<LanguageEntity>[] = [
      {
        name: 'English',
        code: 'en',
        nativeName: 'English',
        isDefault: true,
      },
      {
        name: 'Arabic',
        code: 'ar',
        nativeName: 'العربية',
        isDefault: false,
      },
      {
        name: 'French',
        code: 'fr',
        nativeName: 'Français',
        isDefault: false,
      },
      {
        name: 'Spanish',
        code: 'es',
        nativeName: 'Español',
        isDefault: false,
      },
    ];

    const savedLanguage = await languageRepository.save(language);
    console.log(`Successfully seeded ${savedLanguage.length} language`);

    await queryRunner.commitTransaction();
    console.log('Transaction committed successfully');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding language:', error);
    console.error('Transaction rolled back');
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

// Execute seeder
bootstrap()
  .then(() => {
    console.log('✨ Language seeder finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Language seeder failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
