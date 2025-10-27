import { IsString, IsNotEmpty } from 'class-validator';

export class ProjectChallengeRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
