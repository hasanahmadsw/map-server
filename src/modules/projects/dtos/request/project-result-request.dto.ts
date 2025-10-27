import { IsString, IsNotEmpty } from 'class-validator';

export class ProjectResultRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
