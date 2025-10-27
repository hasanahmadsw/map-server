import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';
import { AnalyticsConfig, ContactInfo, CustomScripts, MetaConfig, SocialLink } from '../types';

@Entity('settings')
export class SettingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  siteName: string;

  @Column()
  siteDescription: string;

  @Column()
  siteLogo: string;

  @Column()
  siteDarkLogo: string;

  @Column()
  siteFavicon: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: MetaConfig;

  @Column({ type: 'jsonb', nullable: true })
  social: SocialLink[];

  @Column({ type: 'jsonb', nullable: true })
  analytics: AnalyticsConfig;

  @Column({ type: 'jsonb', nullable: true })
  contact: ContactInfo;

  @Column({ type: 'jsonb', nullable: true })
  customScripts: CustomScripts;

  @Column({ default: 'en' })
  defaultLanguage: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
