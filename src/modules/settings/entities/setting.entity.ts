import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';
import { AnalyticsConfig, ContactInfo, CustomScripts, MetaConfig, SocialLink } from '../types';

@Entity('settings')
export class SettingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'site_name' })
  siteName: string;

  @Column({ name: 'site_description' })
  siteDescription: string;

  @Column({ name: 'site_logo' })
  siteLogo: string;

  @Column({ name: 'site_dark_logo' })
  siteDarkLogo: string;

  @Column({ name: 'site_favicon' })
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

  @Column({ name: 'default_language', default: 'en' })
  defaultLanguage: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
