import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ProjectChallengeResponseDto {
  @Expose()
  title: string;

  @Expose()
  description: string;
}
