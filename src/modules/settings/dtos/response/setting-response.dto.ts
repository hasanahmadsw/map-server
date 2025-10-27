import { Exclude, Expose, Type } from 'class-transformer';
import { AnalyticsConfig, ContactInfo, CustomScripts, MetaConfig, SocialLink } from '../../types';

@Exclude()
export class SettingResponseDto {
  @Expose()
  id: number;

  @Expose()
  siteName: string;

  @Expose()
  siteDescription: string;

  @Expose()
  siteLogo: string;

  @Expose()
  siteDarkLogo: string;

  @Expose()
  siteFavicon: string;

  @Expose()
  @Type(() => MetaConfig)
  meta?: MetaConfig;

  @Expose()
  @Type(() => SocialLink)
  social?: SocialLink[];

  @Expose()
  @Type(() => AnalyticsConfig)
  analytics?: AnalyticsConfig;

  @Expose()
  @Type(() => ContactInfo)
  contact?: ContactInfo;

  @Expose()
  @Type(() => CustomScripts)
  customScripts?: CustomScripts;

  @Expose()
  defaultLanguage: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
