import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateStaffTranslationDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  languageCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  bio?: string;
}
