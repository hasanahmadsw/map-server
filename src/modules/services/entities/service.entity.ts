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

  @OneToMany(() => ServiceTranslationEntity, (translation) => translation.service)
  translations: ServiceTranslationEntity[];

  @ManyToMany(() => SolutionEntity, (solution) => solution.services)
  @JoinTable({
    name: 'solution_services',
    joinColumn: { name: 'serviceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'solutionId', referencedColumnName: 'id' },
  })
  solutions: SolutionEntity[];

  @ManyToMany(() => ProjectEntity, (project) => project.services)
  @JoinTable({
    name: 'project_services',
    joinColumn: { name: 'serviceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'projectId', referencedColumnName: 'id' },
  })
  projects: ProjectEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
