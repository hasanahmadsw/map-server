import { OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { ProjectFilterDto } from './project-filter.dto';
import { IsLanguageCode } from 'src/common';

export class PublicProjectFilterDto extends OmitType(ProjectFilterDto, ['languageCode']) {
  @IsLanguageCode({ message: 'Language code must be exactly 2 lowercase letters (e.g., "en", "fr", "es")' })
  lang: string;
}
