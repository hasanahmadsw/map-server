import { Exclude, Expose, Type } from 'class-transformer';
import { LanguageEntity } from '../../../languages/entities/language.entity';

@Exclude()
export class StaffTranslationResponseDto {
  @Expose()
  id: number;

  @Expose()
  staffId: number;

  @Expose()
  languageCode: string;

  @Expose()
  name: string;

  @Expose()
  bio: string;

  @Expose()
  @Type(() => LanguageEntity)
  language: LanguageEntity;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
