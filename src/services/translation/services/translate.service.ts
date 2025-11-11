import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TranslationEventTypes } from '../enums/translated-types.enum';
import { SchemaType } from '../types/schema.type';
import { TranslateEvent } from '../events/translate.event';
import { AiTranslatorService } from '../services/ai-translator.service';
import { Semaphore } from 'src/common/utils/semaphore'; // import the class above
import { EntityTypeMap } from '../types/entity-type-map';
import { PrimaryColumnMap } from '../types/primary-column-map';

@Injectable()
export class TranslateService {
  // allow up to 5 concurrent translations
  private readonly semaphore = new Semaphore(10);

  constructor(
    private readonly dataSource: DataSource,
    private readonly aiTranslatorService: AiTranslatorService,
  ) {}

  async translateToOneLanguage(languageCode: string, type: TranslationEventTypes, id: number, content: SchemaType) {
    const language = await this.dataSource
      .getRepository('LanguageEntity')
      .createQueryBuilder('language')
      .where('language.code = :code', { code: languageCode })
      .getOne();

    if (!language) {
      throw new Error(`Language with code ${languageCode} does not exist`);
    }

    const event: TranslateEvent = {
      languageCode,
      translatedType: type,
      languageName: language.name,
      translationFields: content,
      id,
    };

    await this.semaphore.acquire();
    try {
      return await this.aiTranslatorService.translate(event);
    } finally {
      this.semaphore.release();
    }
  }

  async translateToLanguages(languageCodes: string[], type: TranslationEventTypes, id: number, content: SchemaType) {
    const languages = await this.dataSource
      .getRepository('LanguageEntity')
      .createQueryBuilder('language')
      .where('language.code IN (:...codes)', { codes: languageCodes })
      .getMany();

    const translationPromises = languages.map(async (language) => {
      const event: TranslateEvent = {
        languageCode: language.code,
        translatedType: type,
        languageName: language.name,
        translationFields: content,
        id,
      };

      await this.semaphore.acquire();
      try {
        const translated: SchemaType = await this.aiTranslatorService.translate(event);

        await this.dataSource.transaction(async (trx) => {
          const repository = trx.getRepository(EntityTypeMap[event.translatedType]);
          const translation = repository.create({
            ...translated,
            languageCode: event.languageCode,
            [PrimaryColumnMap[event.translatedType]]: event.id,
          });
          await repository.save(translation);
        });

        return { success: true, languageCode: language.code, translated };
      } catch (error) {
        // Log error but don't throw - allow other translations to continue
        console.error(
          `Failed to translate ${type} ${id} to ${language.name} (${language.code}):`,
          error instanceof Error ? error.message : String(error),
        );
        return {
          success: false,
          languageCode: language.code,
          error: error instanceof Error ? error.message : String(error),
        };
      } finally {
        this.semaphore.release();
      }
    });

    // Run all translations in parallel, but concurrency is limited by the semaphore
    // Use Promise.allSettled to handle individual failures gracefully
    const results = await Promise.allSettled(translationPromises);

    // Extract successful translations
    const successfulTranslations = results
      .filter((result) => result.status === 'fulfilled' && result.value.success)
      .map((result) => (result.status === 'fulfilled' ? result.value.translated : null))
      .filter(Boolean);

    return successfulTranslations;
  }
}
