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
import { ProjectEntity } from './project.entity';

@Entity('projects_translations')
@Unique('UQ_PROJECT_LANGUAGE', ['projectId', 'languageCode'])
@Index('IDX_PROJECT_TRANSLATION_NAME', ['name'])
export class ProjectTranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => ProjectEntity, (project) => project.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId', referencedColumnName: 'id' })
  project: ProjectEntity;

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
  challenges: {
    title: string;
    description: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  results: {
    title: string;
    description: string;
  }[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
