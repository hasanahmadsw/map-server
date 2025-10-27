import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './controllers/services.controller';
import { ServicesService } from './services/services.service';
import { ServiceTranslationsService } from './services/service-translations.service';
import { ServiceEntity } from './entities/service.entity';
import { ServiceTranslationEntity } from './entities/service-translation.entity';
import { LanguageEntity } from '../languages/entities/language.entity';
import { SolutionEntity } from '../solutions/entities/solution.entity';
import { LanguagesModule } from '../languages/languages.module';
import { TranslationModule } from 'src/services/translation/translation.module';
import { UploadModule } from 'src/shared/modules/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceEntity, ServiceTranslationEntity, LanguageEntity, SolutionEntity]),
    LanguagesModule,
    TranslationModule,
    UploadModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService, ServiceTranslationsService],
  exports: [ServicesService, ServiceTranslationsService],
})
export class ServicesModule {}
