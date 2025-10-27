import { Expose, Type } from 'class-transformer';
import { SettingResponseDto } from './setting-response.dto';
import { SettingTranslationResponseDto } from './setting-translation-response.dto';

@Expose()
export class SettingsWithTranslationsResponseDto extends SettingResponseDto {
  @Expose()
  @Type(() => SettingTranslationResponseDto)
  translations: SettingTranslationResponseDto[];
}
