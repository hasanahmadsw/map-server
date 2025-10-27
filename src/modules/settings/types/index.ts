import { IsString, IsArray, IsOptional, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class MetaConfig {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  @IsOptional()
  keywords: string[];
}

export class SocialLink {
  @IsString()
  platform: string;

  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  label?: string;
}

export class AnalyticsConfig {
  @IsString()
  @IsOptional()
  googleAnalytics?: string;

  @IsString()
  @IsOptional()
  facebookPixel?: string;

  @IsArray()
  @IsOptional()
  customScripts?: string[];
}

export class ContactInfo {
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  workingHours?: string;
}

export class CustomScripts {
  @IsArray()
  @IsOptional()
  header?: string[];

  @IsArray()
  @IsOptional()
  footer?: string[];
}
