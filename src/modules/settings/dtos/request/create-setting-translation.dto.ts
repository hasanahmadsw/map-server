import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MetaConfig } from '../../types';
import { IsLanguageCode } from 'src/common';

export class CreateSettingTranslationDto {
  @IsLanguageCode()
  languageCode: string;

  @IsString()
  @IsOptional()
  siteName?: string;

  @IsString()
  @IsOptional()
  siteDescription?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => MetaConfig)
  meta?: MetaConfig;

  @IsString()
  @IsOptional()
  siteLogo?: string;

  @IsString()
  @IsOptional()
  siteDarkLogo?: string;
}
