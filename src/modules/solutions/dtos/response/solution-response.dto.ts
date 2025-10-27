import { Exclude, Expose, Type } from 'class-transformer';
import { SolutionTranslationResponseDto } from './solution-translation-response.dto';
import { ServiceResponseDto } from 'src/modules/services/dtos/response/service-response.dto';

@Exclude()
export class SolutionResponseDto {
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
  @Type(() => ServiceResponseDto)
  services?: ServiceResponseDto[];

  @Expose()
  @Type(() => SolutionTranslationResponseDto)
  translations?: SolutionTranslationResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
