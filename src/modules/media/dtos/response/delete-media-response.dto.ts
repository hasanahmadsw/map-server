import { Expose } from 'class-transformer';

export class DeleteMediaResponseDto {
  @Expose()
  deletedCount: number;

  @Expose()
  message: string;
}

