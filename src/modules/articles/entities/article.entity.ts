import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToMany,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { ArticleTranslationEntity } from './article-translation.entity';
import { StaffEntity } from 'src/modules/staff/entities/staff.entity';

@Entity('articles')
@Index('IDX_ARTICLE_SLUG', ['slug'], { unique: true })
export class ArticleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'author_id', nullable: false, type: 'int' })
  authorId: number;

  @ManyToOne(() => StaffEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id', referencedColumnName: 'id' })
  author: StaffEntity;

  @Column({ nullable: true })
  image: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: false, name: 'is_published' })
  isPublished: boolean;

  @Column({ default: false, name: 'is_featured' })
  isFeatured: boolean;

  @Column({ default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  topics: string[];

  @OneToMany(() => ArticleTranslationEntity, (translation) => translation.article)
  translations: ArticleTranslationEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
