import { Expose, Type } from 'class-transformer';
import { PaginationMetadataDto } from 'src/common/pagination/dto/pagination-detadata.dto';
import { MediaFileResponseDto } from './media-file-response.dto';

export class ListMediaResponseDto {
  @Expose()
  @Type(() => MediaFileResponseDto)
  data: MediaFileResponseDto[];

  @Expose()
  @Type(() => PaginationMetadataDto)
  pagination: PaginationMetadataDto;
}
