import { IsString, IsNotEmpty, Length, IsObject, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { AnalyticsConfig, ContactInfo, CustomScripts, MetaConfig, SocialLink } from '../../types';

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  siteName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  siteDescription: string;

  @IsString()
  @IsNotEmpty()
  siteLogo: string;

  @IsString()
  @IsNotEmpty()
  siteDarkLogo: string;

  @IsString()
  @IsNotEmpty()
  siteFavicon: string;

  @IsObject()
  @ValidateNested()
  @Type(() => MetaConfig)
  meta: MetaConfig;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLink)
  social: SocialLink[];

  @IsObject()
  @ValidateNested()
  @Type(() => AnalyticsConfig)
  analytics: AnalyticsConfig;

  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfo)
  contact: ContactInfo;

  @IsObject()
  @ValidateNested()
  @Type(() => CustomScripts)
  customScripts: CustomScripts;
}
