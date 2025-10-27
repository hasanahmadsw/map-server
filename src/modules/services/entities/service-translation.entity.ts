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

  @Column()
  serviceId: number;

  @ManyToOne(() => ServiceEntity, (service) => service.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceId', referencedColumnName: 'id' })
  service: ServiceEntity;

  @ManyToOne(() => LanguageEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'languageCode', referencedColumnName: 'code' })
  language: LanguageEntity;

  @Index()
  @Column({ name: 'languageCode', length: 2 })
  languageCode: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  meta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  subServices: SubService[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
