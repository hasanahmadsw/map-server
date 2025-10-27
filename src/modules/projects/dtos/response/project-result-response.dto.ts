import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ProjectResultResponseDto {
  @Expose()
  title: string;

  @Expose()
  description: string;
}
