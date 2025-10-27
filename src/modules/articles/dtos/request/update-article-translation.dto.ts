import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateArticleTranslationDto } from './create-article-translation.dto';

export class UpdateArticleTranslationDto extends PartialType(OmitType(CreateArticleTranslationDto, ['languageCode'])) {}
