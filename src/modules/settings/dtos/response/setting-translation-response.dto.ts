import { Expose, Type } from 'class-transformer';
import { MetaConfig } from '../../types';

export class SettingTranslationResponseDto {
  @Expose()
  id: number;

  @Expose()
  languageCode: string;

  @Expose()
  siteName: string;

  @Expose()
  siteDescription: string;

  @Expose()
  @Type(() => MetaConfig)
  meta?: MetaConfig;

  @Expose()
  siteLogo: string;

  @Expose()
  siteDarkLogo: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
