import { OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { ServiceFilterDto } from './service-filter.dto';
import { IsLanguageCode } from 'src/common';

export class PublicServiceFilterDto extends OmitType(ServiceFilterDto, ['languageCode']) {
  @IsLanguageCode({ message: 'Language code must be exactly 2 lowercase letters (e.g., "en", "fr", "es")' })
  lang: string;
}
