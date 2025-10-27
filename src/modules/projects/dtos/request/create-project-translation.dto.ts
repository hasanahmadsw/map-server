import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { IsLanguageCode } from 'src/common';
import { Type } from 'class-transformer';

export class CreateProjectTranslationDto {
  @IsLanguageCode()
  languageCode: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsObject()
  @IsOptional()
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  challenges?: {
    title: string;
    description: string;
  }[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  results?: {
    title: string;
    description: string;
  }[];
}
