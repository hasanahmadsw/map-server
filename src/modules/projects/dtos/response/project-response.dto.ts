import { Exclude, Expose, Type } from 'class-transformer';
import { ProjectTranslationResponseDto } from './project-translation-response.dto';
import { ProjectChallengeResponseDto } from './project-challenge-response.dto';
import { ProjectResultResponseDto } from './project-result-response.dto';
import { ServiceResponseDto } from 'src/modules/services/dtos/response/service-response.dto';
import { SolutionResponseDto } from 'src/modules/solutions/dtos/response/solution-response.dto';

@Exclude()
export class ProjectResponseDto {
  @Expose()
  id: number;

  @Expose()
  slug: string;

  @Expose()
  icon?: string;

  @Expose()
  isPublished: boolean;

  @Expose()
  isFeatured: boolean;

  @Expose()
  featuredImage?: string;

  @Expose()
  viewCount: number;

  @Expose()
  order: number;

  @Expose()
  clientName?: string;

  @Expose()
  projectUrl?: string;

  @Expose()
  githubUrl?: string;

  @Expose()
  startDate?: Date;

  @Expose()
  endDate?: Date;

  @Expose()
  technologies?: string[];

  // Translatable fields (for merged responses)
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
  @Type(() => ServiceResponseDto)
  services?: ServiceResponseDto[];

  @Expose()
  @Type(() => SolutionResponseDto)
  solutions?: SolutionResponseDto[];

  @Expose()
  @Type(() => ProjectTranslationResponseDto)
  translations?: ProjectTranslationResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
