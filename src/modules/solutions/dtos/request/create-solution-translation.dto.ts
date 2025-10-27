import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { IsLanguageCode } from 'src/common';

export class CreateSolutionTranslationDto {
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
}
