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
import { SolutionEntity } from './solution.entity';

@Entity('solutions_translations')
@Unique('UQ_SOLUTION_LANGUAGE', ['solutionId', 'languageCode'])
@Index('IDX_SOLUTION_TRANSLATION_NAME', ['name'])
export class SolutionTranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  solutionId: number;

  @ManyToOne(() => SolutionEntity, (solution) => solution.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'solutionId', referencedColumnName: 'id' })
  solution: SolutionEntity;

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

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
