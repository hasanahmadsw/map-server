import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolutionsController } from './controllers/solutions.controller';
import { SolutionsService } from './services/solutions.service';
import { SolutionTranslationsService } from './services/solution-translations.service';
import { SolutionEntity } from './entities/solution.entity';
import { SolutionTranslationEntity } from './entities/solution-translation.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { LanguageEntity } from '../languages/entities/language.entity';
import { LanguagesModule } from '../languages/languages.module';
import { TranslationModule } from 'src/services/translation/translation.module';
import { UploadModule } from 'src/shared/modules/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolutionEntity, SolutionTranslationEntity, ServiceEntity, LanguageEntity]),
    LanguagesModule,
    TranslationModule,
    UploadModule,
  ],
  controllers: [SolutionsController],
  providers: [SolutionsService, SolutionTranslationsService],
  exports: [SolutionsService, SolutionTranslationsService],
})
export class SolutionsModule {}
