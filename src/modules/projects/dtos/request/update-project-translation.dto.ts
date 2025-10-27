import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProjectTranslationDto } from './create-project-translation.dto';

export class UpdateProjectTranslationDto extends PartialType(OmitType(CreateProjectTranslationDto, ['languageCode'])) {}
