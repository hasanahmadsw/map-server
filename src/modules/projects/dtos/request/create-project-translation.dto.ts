import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { IsLanguageCode } from 'src/common';
import { Type } from 'class-transformer';
import { ProjectChallengeRequestDto } from './project-challenge-request.dto';
import { ProjectResultRequestDto } from './project-result-request.dto';

export class CreateProjectTranslationDto {
  @IsLanguageCode()
  languageCode: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsObject()
  @IsOptional()
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProjectChallengeRequestDto)
  challenges?: ProjectChallengeRequestDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProjectResultRequestDto)
  results?: ProjectResultRequestDto[];
}
