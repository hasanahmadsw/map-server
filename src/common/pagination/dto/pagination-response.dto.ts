import { Exclude, Expose, Type } from 'class-transformer';
import { PaginationMetadataDto } from './pagination-detadata.dto';

@Exclude()
export class PaginationResponseDto<T> {
  @Expose()
  data: T[];

  @Expose()
  @Type(() => PaginationMetadataDto)
  pagination: PaginationMetadataDto;

  constructor(data: T[], total: number, currentPage: number, limit: number) {
    this.data = data;

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    this.pagination = {
      limit,
      currentPage,
      total,
      totalPages,
      nextPage: hasNextPage ? currentPage + 1 : null,
      prevPage: hasPrevPage ? currentPage - 1 : null,
      hasNextPage,
      hasPrevPage,
    };
  }
}
