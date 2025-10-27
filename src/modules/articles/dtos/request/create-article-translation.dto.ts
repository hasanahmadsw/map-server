import { IsString, IsNotEmpty, IsOptional, IsNumber, Length, IsObject } from 'class-validator';
import { IsLanguageCode } from 'src/common';

export class CreateArticleTranslationDto {
  @IsLanguageCode()
  languageCode: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsObject()
  @IsOptional()
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}
