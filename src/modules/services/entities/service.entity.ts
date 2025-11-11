import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToMany,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ServiceTranslationEntity } from './service-translation.entity';
import { SolutionEntity } from 'src/modules/solutions/entities/solution.entity';
import { ProjectEntity } from 'src/modules/projects/entities/project.entity';

@Entity('services')
@Index('IDX_SERVICE_SLUG', ['slug'], { unique: true })
export class ServiceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'featured_image', nullable: true })
  featuredImage: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => ServiceTranslationEntity, (translation) => translation.service)
  translations: ServiceTranslationEntity[];

  @ManyToMany(() => SolutionEntity, (solution) => solution.services)
  @JoinTable({
    name: 'solution_services',
    joinColumn: { name: 'service_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'solution_id', referencedColumnName: 'id' },
  })
  solutions: SolutionEntity[];

  @ManyToMany(() => ProjectEntity, (project) => project.services)
  @JoinTable({
    name: 'project_services',
    joinColumn: { name: 'service_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'project_id', referencedColumnName: 'id' },
  })
  projects: ProjectEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
