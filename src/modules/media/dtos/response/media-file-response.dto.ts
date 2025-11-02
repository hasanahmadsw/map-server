import { Expose } from 'class-transformer';

export class MediaFileResponseDto {
  @Expose()
  name: string;

  @Expose()
  path: string;

  @Expose()
  url: string;

  @Expose()
  mimeType?: string;

  @Expose()
  size?: number;

  @Expose()
  createdAt?: string;

  @Expose()
  updatedAt?: string;
}
