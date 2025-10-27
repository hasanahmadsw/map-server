import { Expose, Type } from 'class-transformer';
import { LanguageEntity } from '../../../languages/entities/language.entity';

export class SolutionTranslationResponseDto {
  @Expose()
  id: number;

  @Expose()
  solutionId: number;

  @Expose()
  languageCode: string;

  @Expose()
  name?: string;

  @Expose()
  description?: string;

  @Expose()
  shortDescription?: string;

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
