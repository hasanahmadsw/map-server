import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateSubServiceDto {
  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];
}
