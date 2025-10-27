import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationResponseDto } from './dto/pagination-response.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ClassConstructor, plainToInstance } from 'class-transformer';

export async function paginate<Entity extends ObjectLiteral, ResponseDto = Entity>(
  queryBuilder: SelectQueryBuilder<Entity>,
  paginationDto: PaginationDto,
  responseClass: ClassConstructor<ResponseDto>,
  transformOptions?: any,
): Promise<PaginationResponseDto<ResponseDto>> {
  const page = Math.max(paginationDto.page || 1, 1);
  const limit = Math.min(Math.max(paginationDto.limit || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();
  const transformedData = plainToInstance(responseClass, data, {
    excludeExtraneousValues: true,
    ...transformOptions,
  });

  return new PaginationResponseDto<ResponseDto>(transformedData, total, page, limit);
}
