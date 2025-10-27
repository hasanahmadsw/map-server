import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSolutionTranslationDto } from './create-solution-translation.dto';

export class UpdateSolutionTranslationDto extends PartialType(
  OmitType(CreateSolutionTranslationDto, ['languageCode']),
) {}
