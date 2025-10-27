import { IsString, IsNotEmpty, IsOptional, IsNumber, Length, IsObject, IsArray, ValidateNested } from 'class-validator';
import { IsLanguageCode } from 'src/common';
import { Type } from 'class-transformer';
import { SubService } from '../../interfaces/sub-service.interface';

export class CreateServiceTranslationDto {
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
  @Type(() => Object)
  subServices?: SubService[];
}
