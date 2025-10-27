import { IsString, IsOptional } from 'class-validator';

export class UpdateStaffTranslationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bio?: string;
}
