import { IsString, IsNotEmpty, Length, IsOptional, IsBoolean, IsNumber, Min, IsArray, IsInt } from 'class-validator';
import { IsLanguageCode, IsLanguageCodeArray } from 'src/common';

export class CreateSolutionDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  slug: string;

  @IsString()
  @IsOptional()
  icon?: string;

  // the first translation
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsOptional()
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  featuredImage?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;

  // required: must be provided and must be a 2-letter language code
  @IsLanguageCode()
  languageCode: string;

  @IsLanguageCodeArray()
  translateTo: string[];
}
