import { OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { ArticleFilterDto } from './article-filter.dto';
import { IsLanguageCode } from 'src/common';

export class PublicArticleFilterDto extends OmitType(ArticleFilterDto, ['languageCode']) {
  @IsLanguageCode({ message: 'Language code must be exactly 2 lowercase letters (e.g., "en", "fr", "es")' })
  lang: string;
}
