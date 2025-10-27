import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateServiceTranslationDto } from './create-service-translation.dto';

export class UpdateServiceTranslationDto extends PartialType(OmitType(CreateServiceTranslationDto, ['languageCode'])) {}
