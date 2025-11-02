import { Exclude, Expose, Type } from 'class-transformer';
import { ServiceTranslationResponseDto } from './service-translation-response.dto';
import { SubServiceResponseDto } from './sub-service-response.dto';
import { SolutionResponseDto } from 'src/modules/solutions/dtos/response/solution-response.dto';

@Exclude()
export class ServiceResponseDto {
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
  @Type(() => SubServiceResponseDto)
  subServices?: SubServiceResponseDto[];

  @Expose()
  @Type(() => ServiceTranslationResponseDto)
  translations?: ServiceTranslationResponseDto[];

  @Expose()
  @Type(() => SolutionResponseDto)
  solutions?: SolutionResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
