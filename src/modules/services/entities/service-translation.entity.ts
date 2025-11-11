import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  ManyToOne,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { LanguageEntity } from '../../languages/entities/language.entity';
import { ServiceEntity } from './service.entity';
import { SubService } from '../interfaces/sub-service.interface';

@Entity('services_translations')
@Unique('UQ_SERVICE_LANGUAGE', ['serviceId', 'languageCode'])
@Index('IDX_SERVICE_TRANSLATION_NAME', ['name'])
export class ServiceTranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'service_id' })
  serviceId: number;

  @ManyToOne(() => ServiceEntity, (service) => service.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id', referencedColumnName: 'id' })
  service: ServiceEntity;

  @ManyToOne(() => LanguageEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'language_code', referencedColumnName: 'code' })
  language: LanguageEntity;

  @Index()
  @Column({ name: 'language_code', length: 2 })
  languageCode: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  meta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Column({ name: 'sub_services', type: 'jsonb', nullable: true })
  subServices: SubService[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
