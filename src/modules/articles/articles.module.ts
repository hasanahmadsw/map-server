import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from './controllers/articles.controller';
import { ArticlesService } from './services/articles.service';
import { ArticleTranslationsService } from './services/article-translations.service';
import { ArticleEntity } from './entities/article.entity';
import { ArticleTranslationEntity } from './entities/article-translation.entity';
import { LanguageEntity } from '../languages/entities/language.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity, ArticleTranslationEntity, LanguageEntity])],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleTranslationsService],
  exports: [ArticlesService, ArticleTranslationsService],
})
export class ArticlesModule {}
