import { IsString, IsNotEmpty, Length, IsBoolean, IsOptional } from 'class-validator';

export class CreateLanguageDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  nativeName: string;

  @IsBoolean()
  @IsOptional()
  isDefault: boolean;
}