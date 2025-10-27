import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSettingTranslationDto } from './create-setting-translation.dto';

export class UpdateSettingTranslationDto extends PartialType(OmitType(CreateSettingTranslationDto, ['languageCode'])) {}
