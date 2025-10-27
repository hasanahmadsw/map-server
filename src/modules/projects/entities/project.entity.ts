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
import { ProjectTranslationEntity } from './project-translation.entity';
import { ServiceEntity } from '../../services/entities/service.entity';
import { SolutionEntity } from '../../solutions/entities/solution.entity';

@Entity('projects')
@Index('IDX_PROJECT_SLUG', ['slug'], { unique: true })
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  featuredImage: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ nullable: true })
  clientName: string;

  @Column({ nullable: true })
  projectUrl: string;

  @Column({ nullable: true })
  githubUrl: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  technologies: string[];

  @OneToMany(() => ProjectTranslationEntity, (translation) => translation.project)
  translations: ProjectTranslationEntity[];

  @ManyToMany(() => ServiceEntity, (service) => service.projects)
  @JoinTable({
    name: 'project_services',
    joinColumn: { name: 'projectId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'id' },
  })
  services: ServiceEntity[];

  @ManyToMany(() => SolutionEntity, (solution) => solution.projects)
  @JoinTable({
    name: 'project_solutions',
    joinColumn: { name: 'projectId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'solutionId', referencedColumnName: 'id' },
  })
  solutions: SolutionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
