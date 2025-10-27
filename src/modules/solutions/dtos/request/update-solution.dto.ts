import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSolutionDto } from './create-solution.dto';

export class UpdateSolutionDto extends PartialType(OmitType(CreateSolutionDto, ['languageCode'])) {}
