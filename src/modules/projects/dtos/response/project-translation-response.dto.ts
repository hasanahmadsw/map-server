import { Expose, Type } from 'class-transformer';
import { LanguageEntity } from '../../../languages/entities/language.entity';

export class ProjectTranslationResponseDto {
  @Expose()
  id: number;

  @Expose()
  projectId: number;

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
  challenges?: {
    title: string;
    description: string;
  }[];

  @Expose()
  results?: {
    title: string;
    description: string;
  }[];

  @Expose()
  @Type(() => LanguageEntity)
  language: LanguageEntity;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
