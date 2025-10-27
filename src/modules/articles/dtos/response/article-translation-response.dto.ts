import { Expose, Type } from 'class-transformer';
import { LanguageEntity } from '../../../languages/entities/language.entity';

export class ArticleTranslationResponseDto {
  @Expose()
  id: number;

  @Expose()
  articleId: number;

  @Expose()
  languageCode: string;

  @Expose()
  name?: string;

  @Expose()
  content?: string;

  @Expose()
  excerpt?: string;

  @Expose()
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Expose()
  @Type(() => LanguageEntity)
  language: LanguageEntity;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
