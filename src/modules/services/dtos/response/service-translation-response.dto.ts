import { Expose, Type } from 'class-transformer';
import { LanguageEntity } from '../../../languages/entities/language.entity';
import { SubService } from '../../interfaces/sub-service.interface';

export class ServiceTranslationResponseDto {
  @Expose()
  id: number;

  @Expose()
  serviceId: number;

  @Expose()
  languageCode: string;

  @Expose()
  name?: string;

  @Expose()
  description?: string;

  @Expose()
  shortDescription?: string;

  @Expose()
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Expose()
  subServices?: SubService[];

  @Expose()
  @Type(() => LanguageEntity)
  language: LanguageEntity;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
