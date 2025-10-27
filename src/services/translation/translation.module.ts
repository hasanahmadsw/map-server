import { Global, Module } from '@nestjs/common';
import { AiTranslatorService } from './services/ai-translator.service';

import { TranslateService } from './services/translate.service';

@Global()
@Module({
  providers: [AiTranslatorService, TranslateService],
  exports: [TranslateService],
})
export class TranslationModule {}
