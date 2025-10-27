import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsService } from './services/projects.service';
import { ProjectTranslationsService } from './services/project-translations.service';
import { ProjectEntity } from './entities/project.entity';
import { ProjectTranslationEntity } from './entities/project-translation.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { SolutionEntity } from '../solutions/entities/solution.entity';
import { LanguageEntity } from '../languages/entities/language.entity';
import { LanguagesModule } from '../languages/languages.module';
import { TranslationModule } from 'src/services/translation/translation.module';
import { UploadModule } from 'src/shared/modules/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, ProjectTranslationEntity, ServiceEntity, SolutionEntity, LanguageEntity]),
    LanguagesModule,
    TranslationModule,
    UploadModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectTranslationsService],
  exports: [ProjectsService, ProjectTranslationsService],
})
export class ProjectsModule {}
