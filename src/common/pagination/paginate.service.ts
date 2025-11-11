import { Injectable, Global } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { PaginationResponseDto } from './dto/pagination-response.dto';
export type PaginationArgs = Partial<PaginationDto>;
import { PaginationDto } from './dto/pagination.dto';

@Global()
@Injectable()
export class PaginationService {
  constructor(private readonly config: { maxLimit?: number } = { maxLimit: 1000 }) {}

  sanitize(dto: PaginationArgs) {
    const page = Math.max(dto.page ?? 1, 1);
    const limit = Math.min(Math.max(dto.limit ?? 10, 1), this.config.maxLimit ?? 100);
    const orderDirection: 'ASC' | 'DESC' = dto.orderDirection ?? 'DESC';
    return { page, limit, orderDirection };
  }

  // paginate normal
  async paginateQB<Entity extends ObjectLiteral, Out = Entity>(
    qb: SelectQueryBuilder<Entity>,
    args: PaginationArgs,
    options?: {
      orderBy?: `${string}.${string}`;
      map?: (e: Entity) => Out;
    },
  ): Promise<PaginationResponseDto<Out>> {
    const { page, limit, orderDirection } = this.sanitize(args);
    const skip = (page - 1) * limit;

    const alias = qb.alias;
    const orderBy = options?.orderBy ?? `${alias}.createdAt`;

    // check if the qb has a predefined order
    const hasPredefinedOrder = qb.expressionMap && Object.keys(qb.expressionMap.orderBys ?? {}).length > 0;

    if (!hasPredefinedOrder) {
      qb.orderBy(orderBy, orderDirection);
    }

    // calculate total without ORDER BY (faster + no need for it in the count)
    const countQb = qb.clone();
    // TypeORM automatically removes order in getCount, but we keep it clear:
    // (some versions/drivers keep order)
    (countQb as any).expressionMap.orderBys = {};
    const totalResult = await countQb.getCount();

    const rows = await qb.skip(skip).take(limit).getMany();
    const data = options?.map ? rows.map(options.map) : (rows as unknown as Out[]);

    return new PaginationResponseDto<Out>(data, totalResult, page, limit);
  }

  // paginateSafe solves the problem of row duplication with INNER JOIN
  async paginateSafeQB<Entity extends ObjectLiteral, Out = Entity>(
    qb: SelectQueryBuilder<Entity>,
    args: PaginationArgs,
    options?: {
      primaryId?: `${string}.id`;
      createdAt?: `${string}.created_at` | `${string}.createdAt`;
      map?: (e: Entity) => Out;
      orderDirection?: 'ASC' | 'DESC';
    },
  ): Promise<PaginationResponseDto<Out>> {
    const { page, limit, orderDirection } = this.sanitize({
      ...args,
      orderDirection: options?.orderDirection ?? 'DESC',
    });
    const skip = (page - 1) * limit;

    const alias = qb.alias;
    const idCol = options?.primaryId ?? `${alias}.id`;

    // we select created_at if it exists, otherwise createdAt
    const createdCol = options?.createdAt
      ? options.createdAt
      : (await this.columnExists(qb, `${alias}.created_at`))
        ? `${alias}.created_at`
        : `${alias}.createdAt`;

    // 1) IDs page (with DISTINCT)
    const idQ = qb
      .clone()
      .select(`${idCol}`, 'id')
      .addSelect(`${createdCol}`, 'created_at_for_order')
      .distinct(true)
      .orderBy(createdCol, orderDirection)
      .addOrderBy(idCol, 'ASC')
      .skip(skip)
      .take(limit);

    const idsRaw = await idQ.getRawMany<{ id: number }>();

    // 2) total (with COUNT DISTINCT) - remove ORDER BY for count query
    const totalQ = qb.clone().select(`COUNT(DISTINCT ${idCol})`, 'count');
    totalQ.orderBy(''); // Remove ORDER BY for count query
    const totalRes = await totalQ.getRawOne<{ count: string }>();
    const total = parseInt(totalRes?.count ?? '0', 10);

    if (!idsRaw.length) {
      return new PaginationResponseDto<Out>([], total, page, limit);
    }

    const ids = idsRaw.map((r) => r.id);

    // 3) fetch page entities fully
    const dataRows = await qb
      .clone()
      .andWhereInIds(ids)
      .orderBy(createdCol, orderDirection)
      .addOrderBy(idCol, 'ASC')
      .getMany();

    const data = options?.map ? dataRows.map(options.map) : (dataRows as unknown as Out[]);
    return new PaginationResponseDto<Out>(data, total, page, limit);
  }

  // paginate for an array in memory (if needed)
  paginateArray<T>(items: T[], args: PaginationArgs): PaginationResponseDto<T> {
    const { page, limit } = this.sanitize(args);
    const start = (page - 1) * limit;
    const end = start + limit;
    const slice = items.slice(start, end);
    return new PaginationResponseDto<T>(slice, items.length, page, limit);
  }

  // check if column exists (for created_at/createdAt)
  private async columnExists<Entity extends ObjectLiteral>(
    qb: SelectQueryBuilder<Entity>,
    fullCol: string,
  ): Promise<boolean> {
    try {
      await qb.clone().orderBy(fullCol, 'DESC').take(1).getMany();
      return true;
    } catch {
      return false;
    }
  }
}
