// translation.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from 'src/shared/modules/config/env.schema';
import { generateObject } from 'ai';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { TranslateEvent } from '../events/translate.event';
import { schemaMap } from '../types/schema-type-map';

@Injectable()
export class AiTranslatorService {
  private aiSDKClient: typeof openai;
  private readonly logger = new Logger(AiTranslatorService.name);

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    this.aiSDKClient = createOpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async translate(event: TranslateEvent) {
    const { languageCode, languageName, translationFields, translatedType } = event;

    try {
      const prompt = `
    You are a professional translator. Your task is to translate JSON objects into ${languageName} (language code: ${languageCode}).
  
    IMPORTANT:
    - Always respect the provided JSON schema for structure and keys. The schema defines what properties exist.
    - Translate ONLY the values (strings, text, titles, etc.) that need translation; do not change the keys or the schema structure.
    - If the target language code is "fa", translate to Persian/Farsi, NOT Arabic.
    - Even if the source and target languages use similar scripts, always translate to the correct target language specified by the language code.
    - Some values may contain HTML tags (e.g., <p>, <strong>, <em>); preserve the tags and only translate the visible text inside them.
    - Translate every translatable field according to the schema; do not skip any.
    - Return only valid JSON that matches the given schema, without extra text or explanation.
  
    Here is the JSON to translate:
    ${JSON.stringify(translationFields, null, 2)}
  `;

      const result = await generateObject({
        model: this.aiSDKClient('gpt-4o-mini'),
        schema: schemaMap[translatedType],
        prompt,
        temperature: 0.6,
      });

      return result.object;
    } catch (error) {
      this.logger.error(`An error occurred while translating: ${error}`);
      throw new InternalServerErrorException('An error occurred while translating');
    }
  }
}
