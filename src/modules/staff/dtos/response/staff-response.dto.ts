import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { StaffEntity } from '../../entities/staff.entity';
import { StaffTranslationResponseDto } from './staff-translation-response.dto';

@Exclude()
export class StaffResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  bio?: string;

  @Expose()
  image?: string;

  @Expose()
  @Type(() => StaffTranslationResponseDto)
  translations?: StaffTranslationResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value ?? undefined)
  deletedAt?: Date;

  constructor(staff: StaffEntity) {
    return Object.assign(this, staff);
  }
}
