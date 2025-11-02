import { Expose } from 'class-transformer';

export class UploadMediaResponseDto {
  @Expose()
  urls: string[];
}
