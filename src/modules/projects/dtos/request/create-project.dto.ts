import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  IsArray,
  IsInt,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { IsLanguageCode, IsLanguageCodeArray } from 'src/common';
import { Type } from 'class-transformer';

export class CreateProjectDto {
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

  @IsArray()
  @IsOptional()
  challenges?: {
    title: string;
    description: string;
  }[];

  @IsArray()
  @IsOptional()
  results?: {
    title: string;
    description: string;
  }[];

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

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsUrl()
  @IsOptional()
  projectUrl?: string;

  @IsUrl()
  @IsOptional()
  githubUrl?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technologies?: string[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  serviceIds?: number[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  solutionIds?: number[];

  // required: must be provided and must be a 2-letter language code
  @IsLanguageCode()
  languageCode: string;

  @IsLanguageCodeArray()
  translateTo: string[];
}
