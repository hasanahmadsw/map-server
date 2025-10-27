import { IsOptional, IsString, IsBoolean, IsNumber, Min, IsInt } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class SolutionFilterDto extends PaginationDto {
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
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'name' | 'order';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
