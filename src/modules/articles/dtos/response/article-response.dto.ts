import { Exclude, Expose, Type } from 'class-transformer';
import { ArticleTranslationResponseDto } from './article-translation-response.dto';
import { StaffResponseDto } from 'src/modules/staff/dtos/response/staff-response.dto';

@Exclude()
export class ArticleResponseDto {
  @Expose()
  id: number;

  @Expose()
  slug: string;

  @Expose()
  image?: string;

  @Expose()
  isPublished: boolean;

  @Expose()
  isFeatured: boolean;

  @Expose()
  featuredImage?: string;

  @Expose()
  viewCount: number;

  // Translatable fields (for merged responses)
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
  tags?: string[];

  @Expose()
  topics?: string[];

  @Expose()
  @Type(() => StaffResponseDto)
  author?: StaffResponseDto;

  @Expose()
  @Type(() => ArticleTranslationResponseDto)
  translations?: ArticleTranslationResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
