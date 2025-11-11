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
import { StaffEntity } from './staff.entity';

@Entity('staff_translations')
@Unique('UQ_STAFF_LANGUAGE', ['staffId', 'languageCode'])
export class StaffTranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'staff_id' })
  staffId: number;

  @ManyToOne(() => StaffEntity, (staff) => staff.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'staff_id', referencedColumnName: 'id' })
  staff: StaffEntity;

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
  bio: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
