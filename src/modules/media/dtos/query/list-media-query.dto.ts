import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsPositive, IsString, Max, Min, IsArray } from 'class-validator';

export class ListMediaQueryDto {
  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  signed?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(86400)
  expiresIn?: number = 3600;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsIn(['name', 'created_at', 'updated_at'])
  orderBy?: 'name' | 'created_at' | 'updated_at' = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @IsIn(['image', 'video', 'audio', 'all'])
  type?: 'image' | 'video' | 'audio' | 'all' = 'all';

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null) return undefined;
    const arr = Array.isArray(value) ? value : String(value).split(',');
    return arr.map((v: string) => v.trim()).filter(Boolean);
  })
  @IsArray()
  @IsString({ each: true })
  mime?: string[];
}
