import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreateSolutionDto } from '../dtos/request/create-solution.dto';
import { UpdateSolutionDto } from '../dtos/request/update-solution.dto';
import { SolutionResponseDto } from '../dtos/response/solution-response.dto';
import { SolutionFilterDto } from '../dtos/query/solution-filter.dto';
import { SolutionEntity } from '../entities/solution.entity';
import { SolutionTranslationEntity } from '../entities/solution-translation.entity';
import { ServiceEntity } from '../../services/entities/service.entity';
import { PaginationService } from 'src/common/pagination/paginate.service';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { PublicSolutionFilterDto } from '../dtos/query/public-solution-filter.dto';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { UploadService } from 'src/shared/modules/upload/services/upload.service';

@Injectable()
export class SolutionsService {
  constructor(
    @InjectRepository(SolutionEntity)
    private readonly solutionRepository: Repository<SolutionEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
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

  async create(createSolutionDto: CreateSolutionDto): Promise<SolutionResponseDto> {
    const { languageCode, name, description, shortDescription, meta, ...solutionData } = createSolutionDto;

    // slug must be unique
    const exists = await this.solutionRepository.exist({ where: { slug: solutionData.slug } });
    if (exists) throw new ConflictException('Slug already exists');

    // ensure the languages exist
    await this.languagesService.ensureLanguagesExist([...createSolutionDto.translateTo, languageCode]);

    // omit the default language code
    const translateTo = createSolutionDto.translateTo.filter((code) => code !== languageCode);

    // language must exist
    await this.languagesService.ensureLanguageExists(languageCode);

    const id = await this.dataSource.transaction(async (trx) => {
      // Create the solution
      const solution = trx.getRepository(SolutionEntity).create({
        slug: solutionData.slug,
        isPublished: solutionData.isPublished ?? false,
        isFeatured: solutionData.isFeatured ?? false,
        featuredImage: solutionData.featuredImage,
        viewCount: 0,
        icon: solutionData.icon,
        order: solutionData.order ?? 0,
      });
      const savedSolution = await trx.getRepository(SolutionEntity).save(solution);

      // Create the default translation
      const translation = trx.getRepository(SolutionTranslationEntity).create({
        solutionId: savedSolution.id,
        languageCode: languageCode,
        name,
        description: description ?? null,
        shortDescription: shortDescription ?? null,
        meta: meta ?? null,
        isDefault: true,
      });
      await trx.getRepository(SolutionTranslationEntity).save(translation);

      return savedSolution.id;
    });

    if (translateTo.length > 0) {
      // Translate asynchronously, but don't let translation errors crash the solution creation
      this.translateService
        .translateToLanguages(translateTo, TranslationEventTypes.solution, id, {
          name,
          description,
          shortDescription,
          meta,
        })
        .catch((error) => {
          // Log translation errors but don't throw - solution creation should succeed even if translation fails
          console.error(
            `Failed to translate solution ${id} to languages [${translateTo.join(', ')}]:`,
            error.message || error,
          );
        });
    }

    return this.getById(id);
  }

  async findAll(filterSolutionDto: SolutionFilterDto): Promise<PaginationResponseDto<SolutionResponseDto>> {
    const qb = this.buildBaseQB();

    if (filterSolutionDto.search) {
      qb.andWhere('translations.name ILIKE :search', { search: `%${filterSolutionDto.search}%` });
    }
    if (filterSolutionDto.slug) {
      qb.andWhere('solution.slug = :slug', { slug: filterSolutionDto.slug });
    }
    if (filterSolutionDto.isPublished !== undefined) {
      qb.andWhere('solution.isPublished = :isPublished', { isPublished: filterSolutionDto.isPublished });
    }
    if (filterSolutionDto.isFeatured !== undefined) {
      qb.andWhere('solution.isFeatured = :isFeatured', { isFeatured: filterSolutionDto.isFeatured });
    }
    if (filterSolutionDto.languageCode) {
      qb.andWhere('translations.languageCode = :languageCode', { languageCode: filterSolutionDto.languageCode });
    }
    if (filterSolutionDto.order !== undefined) {
      qb.andWhere('solution.order = :order', { order: filterSolutionDto.order });
    }

    if (filterSolutionDto.sortBy) {
      const sortOrder = filterSolutionDto.sortOrder || 'ASC';
      qb.orderBy(`solution.${filterSolutionDto.sortBy}`, sortOrder);
    } else {
      qb.orderBy('solution.order', 'ASC').addOrderBy('solution.createdAt', 'DESC');
    }

    return this.paginationService.paginateSafeQB(qb, filterSolutionDto, {
      primaryId: 'solution.id',
      createdAt: 'solution.createdAt',
      orderDirection: (filterSolutionDto.sortOrder as 'ASC' | 'DESC') ?? 'DESC',
      map: (e) => plainToInstance(SolutionResponseDto, e, { excludeExtraneousValues: true }),
    });
  }

  async getById(id: number): Promise<SolutionResponseDto> {
    const solution = await this.solutionRepository.findOne({
      where: { id },
      relations: ['translations', 'services', 'services.translations'],
    });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    return plainToInstance(SolutionResponseDto, solution, { enableImplicitConversion: true });
  }

  async findBySlug(slug: string): Promise<SolutionResponseDto> {
    const solution = await this.solutionRepository.findOne({
      where: { slug },
      relations: ['services', 'services.translations'],
    });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    // Increment view count
    solution.viewCount += 1;
    await this.solutionRepository.save(solution);

    return solution;
  }

  async update(id: number, updateSolutionDto: UpdateSolutionDto): Promise<SolutionResponseDto> {
    const solution = await this.solutionRepository.findOne({
      where: { id },
      relations: ['translations', 'services', 'services.translations'],
    });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    // if slug changes, enforce uniqueness
    if (updateSolutionDto.slug && updateSolutionDto.slug !== solution.slug) {
      const exists = await this.solutionRepository.exist({ where: { slug: updateSolutionDto.slug } });
      if (exists) throw new ConflictException('Slug already exists');
    }

    // Update basic solution data
    Object.assign(solution, updateSolutionDto);

    const savedSolution = await this.solutionRepository.save(solution);

    // Reload with relationships for response
    return this.getById(savedSolution.id);
  }

  async delete(id: number): Promise<void> {
    const solution = await this.solutionRepository.findOne({ where: { id } });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    await this.solutionRepository.delete(id);
  }

  async publish(id: number): Promise<SolutionResponseDto> {
    const solution = await this.solutionRepository.findOne({ where: { id } });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    solution.isPublished = true;
    const savedSolution = await this.solutionRepository.save(solution);

    return this.getById(savedSolution.id);
  }

  async unpublish(id: number): Promise<SolutionResponseDto> {
    const solution = await this.solutionRepository.findOne({ where: { id } });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    solution.isPublished = false;
    const savedSolution = await this.solutionRepository.save(solution);

    return this.getById(savedSolution.id);
  }

  async toggleFeatured(id: number): Promise<SolutionResponseDto> {
    const solution = await this.solutionRepository.findOne({ where: { id } });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    solution.isFeatured = !solution.isFeatured;
    const savedSolution = await this.solutionRepository.save(solution);

    return this.getById(savedSolution.id);
  }

  async getPublishedSolutions(filter: PublicSolutionFilterDto): Promise<PaginationResponseDto<SolutionResponseDto>> {
    const languageCode = filter.lang;
    await this.languagesService.ensureLanguageExists(languageCode);

    const qb = this.solutionRepository
      .createQueryBuilder('solution')
      .leftJoinAndSelect('solution.translations', 'translations')
      .leftJoinAndSelect('solution.services', 'services')
      .leftJoinAndSelect('services.translations', 'serviceTranslations')
      .andWhere('solution.isPublished = :isPublished', { isPublished: true });

    if (filter.search) {
      qb.andWhere('translations.name ILIKE :search', { search: `%${filter.search}%` });
    }
    if (filter.isFeatured !== undefined) {
      qb.andWhere('solution.isFeatured = :isFeatured', { isFeatured: filter.isFeatured });
    }
    if (filter.order !== undefined) {
      qb.andWhere('solution.order = :order', { order: filter.order });
    }

    if (filter.sortBy) {
      const sortOrder = filter.sortOrder || 'ASC';
      qb.orderBy(`solution.${filter.sortBy}`, sortOrder);
    } else {
      qb.orderBy('solution.order', 'ASC').addOrderBy('solution.createdAt', 'DESC');
    }

    const result = await this.paginationService.paginateSafeQB(qb, filter, {
      primaryId: 'solution.id',
      createdAt: 'solution.createdAt',
      orderDirection: (filter.sortOrder as 'ASC' | 'DESC') ?? 'DESC',
      map: (e) => plainToInstance(SolutionResponseDto, e, { excludeExtraneousValues: true }),
    });

    // post-processing: اختر ترجمة اللغة المطلوبة ثم الافتراضية
    result.data = result.data.map((solution: any) => {
      if (Array.isArray(solution.translations)) {
        const requested = solution.translations.find((t: any) => t.languageCode === languageCode);
        const fallback = solution.translations.find((t: any) => t.isDefault);
        solution.translations = requested ? [requested] : fallback ? [fallback] : solution.translations;
      }
      if (Array.isArray(solution.services)) {
        solution.services = solution.services.map((service: any) => {
          if (Array.isArray(service.translations)) {
            const sReq = service.translations.find((t: any) => t.languageCode === languageCode);
            const sDef = service.translations.find((t: any) => t.isDefault);
            service.translations = sReq ? [sReq] : sDef ? [sDef] : service.translations;
          }
          return service;
        });
      }
      return solution;
    });

    return result;
  }

  async getFeaturedSolutions(filter: PublicSolutionFilterDto): Promise<PaginationResponseDto<SolutionResponseDto>> {
    const languageCode = filter.lang;
    await this.languagesService.ensureLanguageExists(languageCode);

    const qb = this.buildBaseQB(languageCode)
      .andWhere('solution.isFeatured = :isFeatured', { isFeatured: true })
      .andWhere('solution.isPublished = :isPublished', { isPublished: true });

    if (filter.search) {
      qb.andWhere('translations.name ILIKE :search', { search: `%${filter.search}%` });
    }
    if (filter.order !== undefined) {
      qb.andWhere('solution.order = :order', { order: filter.order });
    }

    if (filter.sortBy) {
      const sortOrder = filter.sortOrder || 'ASC';
      qb.orderBy(`solution.${filter.sortBy}`, sortOrder);
    } else {
      qb.orderBy('solution.order', 'ASC').addOrderBy('solution.createdAt', 'DESC');
    }

    return this.paginationService.paginateSafeQB(qb, filter, {
      primaryId: 'solution.id',
      createdAt: 'solution.createdAt',
      orderDirection: (filter.sortOrder as 'ASC' | 'DESC') ?? 'DESC',
      map: (e) => plainToInstance(SolutionResponseDto, e, { excludeExtraneousValues: true }),
    });
  }

  async getBySlugPublic(slug: string, languageCode: string): Promise<SolutionResponseDto> {
    await this.languagesService.ensureLanguageExists(languageCode);

    // Use left join to include solution even if translation for requested language doesn't exist
    const solution = await this.solutionRepository
      .createQueryBuilder('solution')
      .leftJoinAndSelect('solution.translations', 'translations')
      .leftJoinAndSelect('solution.services', 'services')
      .leftJoinAndSelect('services.translations', 'serviceTranslations')
      .andWhere('solution.slug = :slug', { slug })
      .andWhere('solution.isPublished = :isPublished', { isPublished: true })
      .getOne();

    if (!solution) throw new NotFoundException('Solution not found');

    // Post-process to select the correct translation (prefer requested language, fall back to default)
    if (solution.translations && Array.isArray(solution.translations)) {
      const requestedTranslation = solution.translations.find((t: any) => t.languageCode === languageCode);
      const defaultTranslation = solution.translations.find((t: any) => t.isDefault);
      solution.translations = requestedTranslation
        ? [requestedTranslation]
        : defaultTranslation
          ? [defaultTranslation]
          : solution.translations;

      // Same for services
      if (solution.services && Array.isArray(solution.services)) {
        solution.services = solution.services.map((service: any) => {
          if (service.translations && Array.isArray(service.translations)) {
            const serviceRequestedTranslation = service.translations.find((t: any) => t.languageCode === languageCode);
            const serviceDefaultTranslation = service.translations.find((t: any) => t.isDefault);
            service.translations = serviceRequestedTranslation
              ? [serviceRequestedTranslation]
              : serviceDefaultTranslation
                ? [serviceDefaultTranslation]
                : service.translations;
          }
          return service;
        });
      }
    }

    // Increment view count without saving relations
    await this.solutionRepository.update(solution.id, { viewCount: solution.viewCount + 1 });

    return solution;
  }

  // ---------- Helpers ----------
  private buildBaseQB(languageCode?: string): SelectQueryBuilder<SolutionEntity> {
    const qb = this.solutionRepository.createQueryBuilder('solution');

    if (languageCode) {
      qb.innerJoinAndSelect('solution.translations', 'translations', 'translations.languageCode = :languageCode', {
        languageCode,
      });
    } else {
      qb.leftJoinAndSelect('solution.translations', 'translations');
    }

    qb.leftJoinAndSelect('solution.services', 'services');

    if (languageCode) {
      qb.innerJoinAndSelect(
        'services.translations',
        'serviceTranslations',
        'serviceTranslations.languageCode = :languageCode',
        {
          languageCode,
        },
      );
    } else {
      qb.leftJoinAndSelect('services.translations', 'serviceTranslations');
    }

    qb.orderBy('solution.order', 'ASC').addOrderBy('solution.createdAt', 'DESC');

    return qb;
  }
}
