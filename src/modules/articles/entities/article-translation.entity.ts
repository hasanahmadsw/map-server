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
import { ArticleEntity } from './article.entity';

@Entity('articles_translations')
@Unique('UQ_ARTICLE_LANGUAGE', ['articleId', 'languageCode'])
@Index('IDX_ARTICLE_TRANSLATION_NAME', ['name'])
export class ArticleTranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'article_id', nullable: false, type: 'int' })
  articleId: number;

  @ManyToOne(() => ArticleEntity, (article) => article.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id', referencedColumnName: 'id' })
  article: ArticleEntity;

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
  content: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  meta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
