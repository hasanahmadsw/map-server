import { Expose } from 'class-transformer';

export class SubServiceResponseDto {
  @Expose()
  icon?: string;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Expose()
  features?: string[];
}
