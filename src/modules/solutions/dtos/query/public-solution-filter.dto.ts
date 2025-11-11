import { OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { SolutionFilterDto } from './solution-filter.dto';
import { IsLanguageCode } from 'src/common';

export class PublicSolutionFilterDto extends OmitType(SolutionFilterDto, ['languageCode']) {
  @IsOptional()
  @IsLanguageCode({ message: 'Language code must be exactly 2 lowercase letters (e.g., "en", "fr", "es")' })
  lang?: string;
}
