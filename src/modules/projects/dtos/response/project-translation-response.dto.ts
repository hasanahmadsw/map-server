import { Expose, Type } from 'class-transformer';
import { LanguageEntity } from '../../../languages/entities/language.entity';
import { ProjectChallengeResponseDto } from './project-challenge-response.dto';
import { ProjectResultResponseDto } from './project-result-response.dto';

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
  @Type(() => ProjectChallengeResponseDto)
  challenges?: ProjectChallengeResponseDto[];

  @Expose()
  @Type(() => ProjectResultResponseDto)
  results?: ProjectResultResponseDto[];

  @Expose()
  @Type(() => LanguageEntity)
  language: LanguageEntity;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
