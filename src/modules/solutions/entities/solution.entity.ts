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
import { SolutionTranslationEntity } from './solution-translation.entity';
import { ServiceEntity } from '../../services/entities/service.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('solutions')
@Index('IDX_SOLUTION_SLUG', ['slug'], { unique: true })
export class SolutionEntity {
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

  @OneToMany(() => SolutionTranslationEntity, (translation) => translation.solution)
  translations: SolutionTranslationEntity[];

  @ManyToMany(() => ServiceEntity, (service) => service.solutions)
  @JoinTable({
    name: 'solution_services',
    joinColumn: { name: 'solutionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'id' },
  })
  services: ServiceEntity[];

  @ManyToMany(() => ProjectEntity, (project) => project.solutions)
  @JoinTable({
    name: 'solution_projects',
    joinColumn: { name: 'solutionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'projectId', referencedColumnName: 'id' },
  })
  projects: ProjectEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
