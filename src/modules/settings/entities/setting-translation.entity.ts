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
  @JoinColumn({ name: 'languageCode', referencedColumnName: 'code' })
  language: LanguageEntity;

  @Index()
  @Column({ name: 'languageCode', length: 2 })
  languageCode: string;

  @Column({ nullable: true })
  siteName: string;

  @Column({ type: 'text', nullable: true })
  siteDescription: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };

  @Column({ nullable: true })
  siteLogo: string;

  @Column({ nullable: true })
  siteDarkLogo: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
