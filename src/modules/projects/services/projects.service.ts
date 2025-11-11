import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreateProjectDto } from '../dtos/request/create-project.dto';
import { UpdateProjectDto } from '../dtos/request/update-project.dto';
import { ProjectResponseDto } from '../dtos/response/project-response.dto';
import { ProjectFilterDto } from '../dtos/query/project-filter.dto';
import { ProjectEntity } from '../entities/project.entity';
import { ProjectTranslationEntity } from '../entities/project-translation.entity';
import { ServiceEntity } from '../../services/entities/service.entity';
import { SolutionEntity } from '../../solutions/entities/solution.entity';
import { PaginationService } from 'src/common/pagination/paginate.service';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { PublicProjectFilterDto } from '../dtos/query/public-project-filter.dto';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { UploadService } from 'src/shared/modules/upload/services/upload.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(SolutionEntity)
    private readonly solutionRepository: Repository<SolutionEntity>,
    private readonly translateService: TranslateService,
    private readonly languagesService: LanguagesService,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService,
  ) {}

  async uploadPicture(picture: Express.Multer.File): Promise<{ url: string }> {
    const url = await this.uploadService.uploadPicture(picture);
    return { url };
  }

  async create(createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    const {
      languageCode,
      name,
      description,
      shortDescription,
      meta,
      challenges,
      results,
      serviceIds,
      solutionIds,
      startDate,
      endDate,
      ...projectData
    } = createProjectDto;

    // slug must be unique
    const exists = await this.projectRepository.exist({ where: { slug: projectData.slug } });
    if (exists) throw new ConflictException('Slug already exists');

    // ensure the languages exist
    await this.languagesService.ensureLanguagesExist([...createProjectDto.translateTo, languageCode]);

    // omit the default language code
    const translateTo = createProjectDto.translateTo.filter((code) => code !== languageCode);

    // language must exist
    await this.languagesService.ensureLanguageExists(languageCode);

    const id = await this.dataSource.transaction(async (trx) => {
      // Create the project
      const project = trx.getRepository(ProjectEntity).create({
        slug: projectData.slug,
        isPublished: projectData.isPublished ?? false,
        isFeatured: projectData.isFeatured ?? false,
        featuredImage: projectData.featuredImage,
        viewCount: 0,
        icon: projectData.icon,
        order: projectData.order ?? 0,
        clientName: projectData.clientName,
        projectUrl: projectData.projectUrl,
        githubUrl: projectData.githubUrl,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        technologies: projectData.technologies,
      });
      const savedProject = await trx.getRepository(ProjectEntity).save(project);

      // Create the default translation
      const translation = trx.getRepository(ProjectTranslationEntity).create({
        projectId: savedProject.id,
        languageCode: languageCode,
        name,
        description: description ?? null,
        shortDescription: shortDescription ?? null,
        meta: meta ?? null,
        challenges: challenges ?? null,
        results: results ?? null,
        isDefault: true,
      });
      await trx.getRepository(ProjectTranslationEntity).save(translation);

      // Associate services if provided
      if (serviceIds && serviceIds.length > 0) {
        const services = await trx.getRepository(ServiceEntity).findBy({ id: In(serviceIds) });
        if (services.length !== serviceIds.length) {
          const foundIds = services.map((s) => s.id);
          const missingIds = serviceIds.filter((id) => !foundIds.includes(id));
          throw new BadRequestException(`Services with IDs ${missingIds.join(', ')} not found`);
        }

        // Insert service-project relationships directly
        for (const service of services) {
          await trx.query('INSERT INTO project_services (project_id, service_id) VALUES ($1, $2)', [
            savedProject.id,
            service.id,
          ]);
        }
      }

      // Associate solutions if provided
      if (solutionIds && solutionIds.length > 0) {
        const solutions = await trx.getRepository(SolutionEntity).findBy({ id: In(solutionIds) });
        if (solutions.length !== solutionIds.length) {
          const foundIds = solutions.map((s) => s.id);
          const missingIds = solutionIds.filter((id) => !foundIds.includes(id));
          throw new BadRequestException(`Solutions with IDs ${missingIds.join(', ')} not found`);
        }

        // Insert solution-project relationships directly
        for (const solution of solutions) {
          await trx.query('INSERT INTO solution_projects (project_id, solution_id) VALUES ($1, $2)', [
            savedProject.id,
            solution.id,
          ]);
        }
      }

      return savedProject.id;
    });

    if (translateTo.length > 0) {
      this.translateService.translateToLanguages(translateTo, TranslationEventTypes.project, id, {
        name,
        description,
        shortDescription,
        meta,
        challenges,
        results,
      });
    }

    return this.getById(id);
  }

  async findAll(filterProjectDto: ProjectFilterDto): Promise<PaginationResponseDto<ProjectResponseDto>> {
    const qb = this.buildBaseQB();

    // Search by slug or translation content
    if (filterProjectDto.search) {
      qb.andWhere('translations.name ILIKE :search', { search: `%${filterProjectDto.search}%` });
    }

    // Filter by slug
    if (filterProjectDto.slug) {
      qb.andWhere('project.slug = :slug', { slug: filterProjectDto.slug });
    }

    // Filter by published status
    if (filterProjectDto.isPublished !== undefined) {
      qb.andWhere('project.isPublished = :isPublished', {
        isPublished: filterProjectDto.isPublished,
      });
    }

    // Filter by featured status
    if (filterProjectDto.isFeatured !== undefined) {
      qb.andWhere('project.isFeatured = :isFeatured', {
        isFeatured: filterProjectDto.isFeatured,
      });
    }

    // Filter by language
    if (filterProjectDto.languageCode) {
      qb.andWhere('translations.languageCode = :languageCode', { languageCode: filterProjectDto.languageCode });
    }

    // Filter by order
    if (filterProjectDto.order !== undefined) {
      qb.andWhere('project.order = :order', { order: filterProjectDto.order });
    }

    // Filter by client name
    if (filterProjectDto.clientName) {
      qb.andWhere('project.clientName ILIKE :clientName', { clientName: `%${filterProjectDto.clientName}%` });
    }

    // Filter by technology
    if (filterProjectDto.technology) {
      qb.andWhere('project.technologies @> :technology', { technology: JSON.stringify([filterProjectDto.technology]) });
    }

    // Filter by start date range
    if (filterProjectDto.startDateFrom) {
      qb.andWhere('project.startDate >= :startDateFrom', { startDateFrom: filterProjectDto.startDateFrom });
    }
    if (filterProjectDto.startDateTo) {
      qb.andWhere('project.startDate <= :startDateTo', { startDateTo: filterProjectDto.startDateTo });
    }

    // Filter by service
    if (filterProjectDto.serviceId !== undefined) {
      qb.andWhere('services.id = :serviceId', { serviceId: filterProjectDto.serviceId });
    }

    // Filter by solution
    if (filterProjectDto.solutionId !== undefined) {
      qb.andWhere('solutions.id = :solutionId', { solutionId: filterProjectDto.solutionId });
    }

    // Sorting
    if (filterProjectDto.sortBy) {
      const sortOrder = filterProjectDto.sortOrder || 'ASC';
      qb.orderBy(`project.${filterProjectDto.sortBy}`, sortOrder);
    } else {
      qb.orderBy('project.order', 'ASC').addOrderBy('project.createdAt', 'DESC');
    }

    return this.paginationService.paginateSafeQB(qb, filterProjectDto, {
      primaryId: 'project.id',
      createdAt: 'project.createdAt',
      map: (e) => plainToInstance(ProjectResponseDto, e, { excludeExtraneousValues: true }),
      orderDirection: (filterProjectDto.sortOrder as 'ASC' | 'DESC') ?? 'DESC',
    });
  }

  async getById(id: number): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['translations', 'services', 'solutions'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return plainToInstance(ProjectResponseDto, project, { enableImplicitConversion: true });
  }

  async findBySlug(slug: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { slug },
      relations: ['services', 'solutions'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Increment view count
    project.viewCount += 1;
    await this.projectRepository.save(project);

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['translations', 'services', 'solutions'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // if slug changes, enforce uniqueness
    if (updateProjectDto.slug && updateProjectDto.slug !== project.slug) {
      const exists = await this.projectRepository.exist({ where: { slug: updateProjectDto.slug } });
      if (exists) throw new ConflictException('Slug already exists');
    }

    // Store current image for cleanup
    let previousImage = null;
    if (updateProjectDto.featuredImage) {
      previousImage = project.featuredImage;
    }

    // Handle service associations
    if (updateProjectDto.serviceIds !== undefined) {
      // Remove existing service associations
      await this.dataSource.query('DELETE FROM project_services WHERE project_id = $1', [project.id]);

      if (updateProjectDto.serviceIds.length > 0) {
        const services = await this.serviceRepository.findBy({ id: In(updateProjectDto.serviceIds) });
        if (services.length !== updateProjectDto.serviceIds.length) {
          const foundIds = services.map((s) => s.id);
          const missingIds = updateProjectDto.serviceIds.filter((id) => !foundIds.includes(id));
          throw new BadRequestException(`Services with IDs ${missingIds.join(', ')} not found`);
        }

        // Insert new service-project relationships
        for (const service of services) {
          await this.dataSource.query('INSERT INTO project_services (project_id, service_id) VALUES ($1, $2)', [
            project.id,
            service.id,
          ]);
        }
      }
    }

    // Handle solution associations
    if (updateProjectDto.solutionIds !== undefined) {
      // Remove existing solution associations
      await this.dataSource.query('DELETE FROM solution_projects WHERE project_id = $1', [project.id]);

      if (updateProjectDto.solutionIds.length > 0) {
        const solutions = await this.solutionRepository.findBy({ id: In(updateProjectDto.solutionIds) });
        if (solutions.length !== updateProjectDto.solutionIds.length) {
          const foundIds = solutions.map((s) => s.id);
          const missingIds = updateProjectDto.solutionIds.filter((id) => !foundIds.includes(id));
          throw new BadRequestException(`Solutions with IDs ${missingIds.join(', ')} not found`);
        }

        // Insert new solution-project relationships
        for (const solution of solutions) {
          await this.dataSource.query('INSERT INTO solution_projects (project_id, solution_id) VALUES ($1, $2)', [
            project.id,
            solution.id,
          ]);
        }
      }
    }

    // Handle date fields
    if (updateProjectDto.startDate) {
      project.startDate = new Date(updateProjectDto.startDate);
    }
    if (updateProjectDto.endDate) {
      project.endDate = new Date(updateProjectDto.endDate);
    }

    // Update basic project data
    const { serviceIds, solutionIds, ...projectData } = updateProjectDto;
    Object.assign(project, projectData);

    const savedProject = await this.projectRepository.save(project);

    if (previousImage) {
      this.uploadService.deleteFiles([previousImage]);
    }

    // Reload with relationships for response
    return this.getById(savedProject.id);
  }

  async delete(id: number): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.featuredImage) {
      await this.uploadService.deleteFiles([project.featuredImage]);
    }

    await this.projectRepository.delete(id);
  }

  async publish(id: number): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.isPublished = true;
    const savedProject = await this.projectRepository.save(project);

    return this.getById(savedProject.id);
  }

  async unpublish(id: number): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.isPublished = false;
    const savedProject = await this.projectRepository.save(project);

    return this.getById(savedProject.id);
  }

  async toggleFeatured(id: number): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.isFeatured = !project.isFeatured;
    const savedProject = await this.projectRepository.save(project);

    return this.getById(savedProject.id);
  }

  async getPublishedProjects(filter: PublicProjectFilterDto): Promise<PaginationResponseDto<ProjectResponseDto>> {
    const languageCode = filter.lang;
    await this.languagesService.ensureLanguageExists(languageCode);

    const qb = this.buildBaseQB(languageCode).andWhere('project.isPublished = :isPublished', { isPublished: true });

    // Apply additional filters if provided
    if (filter) {
      if (filter.search) {
        qb.andWhere('translations.name ILIKE :search', { search: `%${filter.search}%` });
      }

      if (filter.isFeatured !== undefined) {
        qb.andWhere('project.isFeatured = :isFeatured', { isFeatured: filter.isFeatured });
      }

      if (filter.order !== undefined) {
        qb.andWhere('project.order = :order', { order: filter.order });
      }

      if (filter.clientName) {
        qb.andWhere('project.clientName ILIKE :clientName', { clientName: `%${filter.clientName}%` });
      }

      if (filter.technology) {
        qb.andWhere('project.technologies @> :technology', { technology: JSON.stringify([filter.technology]) });
      }

      if (filter.startDateFrom) {
        qb.andWhere('project.startDate >= :startDateFrom', { startDateFrom: filter.startDateFrom });
      }
      if (filter.startDateTo) {
        qb.andWhere('project.startDate <= :startDateTo', { startDateTo: filter.startDateTo });
      }

      if (filter.sortBy) {
        const sortOrder = filter.sortOrder || 'ASC';
        qb.orderBy(`project.${filter.sortBy}`, sortOrder);
      } else {
        qb.orderBy('project.order', 'ASC').addOrderBy('project.createdAt', 'DESC');
      }
    } else {
      qb.orderBy('project.order', 'ASC').addOrderBy('project.createdAt', 'DESC');
    }

    // Get paginated results with raw entities
    return this.paginationService.paginateSafeQB(qb, filter, {
      primaryId: 'project.id',
      createdAt: 'project.createdAt',
      map: (e) => plainToInstance(ProjectResponseDto, e, { excludeExtraneousValues: true }),
      orderDirection: (filter.sortOrder as 'ASC' | 'DESC') ?? 'DESC',
    });
  }

  async getFeaturedProjects(filter: PublicProjectFilterDto): Promise<PaginationResponseDto<ProjectResponseDto>> {
    const languageCode = filter.lang;
    await this.languagesService.ensureLanguageExists(languageCode);

    const qb = this.buildBaseQB(languageCode)
      .andWhere('project.isFeatured = :isFeatured', { isFeatured: true })
      .andWhere('project.isPublished = :isPublished', { isPublished: true });

    // Apply additional filters if provided
    if (filter) {
      if (filter.search) {
        qb.andWhere('translations.name ILIKE :search', { search: `%${filter.search}%` });
      }

      if (filter.order !== undefined) {
        qb.andWhere('project.order = :order', { order: filter.order });
      }

      if (filter.clientName) {
        qb.andWhere('project.clientName ILIKE :clientName', { clientName: `%${filter.clientName}%` });
      }

      if (filter.technology) {
        qb.andWhere('project.technologies @> :technology', { technology: JSON.stringify([filter.technology]) });
      }

      if (filter.startDateFrom) {
        qb.andWhere('project.startDate >= :startDateFrom', { startDateFrom: filter.startDateFrom });
      }
      if (filter.startDateTo) {
        qb.andWhere('project.startDate <= :startDateTo', { startDateTo: filter.startDateTo });
      }

      if (filter.sortBy) {
        const sortOrder = filter.sortOrder || 'ASC';
        qb.orderBy(`project.${filter.sortBy}`, sortOrder);
      } else {
        qb.orderBy('project.order', 'ASC').addOrderBy('project.createdAt', 'DESC');
      }
    } else {
      qb.orderBy('project.order', 'ASC').addOrderBy('project.createdAt', 'DESC');
    }

    // Get paginated results with raw entities
    return this.paginationService.paginateSafeQB(qb, filter, {
      primaryId: 'project.id',
      createdAt: 'project.createdAt',
      map: (e) => plainToInstance(ProjectResponseDto, e, { excludeExtraneousValues: true }),
      orderDirection: (filter.sortOrder as 'ASC' | 'DESC') ?? 'DESC',
    });
  }

  async getBySlugPublic(slug: string, languageCode: string): Promise<ProjectResponseDto> {
    await this.languagesService.ensureLanguageExists(languageCode);

    const project = await this.buildBaseQB(languageCode)
      .andWhere('project.slug = :slug', { slug })
      .andWhere('project.isPublished = :isPublished', { isPublished: true })
      .andWhere('translations.languageCode = :languageCode', { languageCode })
      .getOne();

    if (!project) throw new NotFoundException('Project not found');

    // Increment view count without saving relations
    await this.projectRepository.update(project.id, { viewCount: project.viewCount + 1 });

    return project;
  }

  // ---------- Helpers ----------
  private buildBaseQB(languageCode?: string): SelectQueryBuilder<ProjectEntity> {
    const qb = this.projectRepository.createQueryBuilder('project');

    if (languageCode) {
      qb.innerJoinAndSelect('project.translations', 'translations', 'translations.languageCode = :languageCode', {
        languageCode,
      });
    } else {
      qb.leftJoinAndSelect('project.translations', 'translations');
    }

    qb.leftJoinAndSelect('project.services', 'services');
    qb.leftJoinAndSelect('project.solutions', 'solutions');

    qb.orderBy('project.order', 'ASC').addOrderBy('project.createdAt', 'DESC');

    return qb;
  }
}
