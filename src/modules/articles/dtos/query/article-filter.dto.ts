import { IsOptional, IsString, IsBoolean, IsArray, IsNumber, Min, IsInt } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class ArticleFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  languageCode?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'name';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
