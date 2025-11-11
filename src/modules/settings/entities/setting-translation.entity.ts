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

@Entity('settings_translations')
@Unique('UQ_SETTING_LANGUAGE', ['languageCode'])
export class SettingTranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LanguageEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'language_code', referencedColumnName: 'code' })
  language: LanguageEntity;

  @Index()
  @Column({ name: 'language_code', length: 2 })
  languageCode: string;

  @Column({ name: 'site_name', nullable: true })
  siteName: string;

  @Column({ name: 'site_description', type: 'text', nullable: true })
  siteDescription: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };

  @Column({ name: 'site_logo', nullable: true })
  siteLogo: string;

  @Column({ name: 'site_dark_logo', nullable: true })
  siteDarkLogo: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
