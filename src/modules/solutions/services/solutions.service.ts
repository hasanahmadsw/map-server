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
import { paginate } from 'src/common/pagination/paginate.service';
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
    private readonly translateService: TranslateService,
    private readonly languagesService: LanguagesService,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
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
      this.translateService.translateToLanguages(translateTo, TranslationEventTypes.solution, id, {
        name,
        description,
        shortDescription,
        meta,
      });
    }

    return this.getById(id);
  }

  async findAll(filterSolutionDto: SolutionFilterDto): Promise<PaginationResponseDto<SolutionResponseDto>> {
    const qb = this.buildBaseQB();

    // Search by slug or translation content
    if (filterSolutionDto.search) {
      qb.andWhere('translations.name ILIKE :search', { search: `%${filterSolutionDto.search}%` });
    }

    // Filter by slug
    if (filterSolutionDto.slug) {
      qb.andWhere('solution.slug = :slug', { slug: filterSolutionDto.slug });
    }

    // Filter by published status
    if (filterSolutionDto.isPublished !== undefined) {
      qb.andWhere('solution.isPublished = :isPublished', {
        isPublished: filterSolutionDto.isPublished,
      });
    }

    // Filter by featured status
    if (filterSolutionDto.isFeatured !== undefined) {
      qb.andWhere('solution.isFeatured = :isFeatured', {
        isFeatured: filterSolutionDto.isFeatured,
      });
    }

    // Filter by language
    if (filterSolutionDto.languageCode) {
      qb.andWhere('translations.languageCode = :languageCode', { languageCode: filterSolutionDto.languageCode });
    }

    // Filter by order
    if (filterSolutionDto.order !== undefined) {
      qb.andWhere('solution.order = :order', { order: filterSolutionDto.order });
    }

    // Sorting
    if (filterSolutionDto.sortBy) {
      const sortOrder = filterSolutionDto.sortOrder || 'ASC';
      qb.orderBy(`solution.${filterSolutionDto.sortBy}`, sortOrder);
    } else {
      qb.orderBy('solution.order', 'ASC').addOrderBy('solution.createdAt', 'DESC');
    }

    return paginate(qb, filterSolutionDto, SolutionResponseDto);
  }

  async getById(id: number): Promise<SolutionResponseDto> {
    const solution = await this.solutionRepository.findOne({
      where: { id },
      relations: ['translations', 'services'],
    });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    return plainToInstance(SolutionResponseDto, solution, { enableImplicitConversion: true });
  }

  async findBySlug(slug: string): Promise<SolutionResponseDto> {
    const solution = await this.solutionRepository.findOne({
      where: { slug },
      relations: ['services'],
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
    const solution = await this.solutionRepository.findOne({ where: { id }, relations: ['translations', 'services'] });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    // if slug changes, enforce uniqueness
    if (updateSolutionDto.slug && updateSolutionDto.slug !== solution.slug) {
      const exists = await this.solutionRepository.exist({ where: { slug: updateSolutionDto.slug } });
      if (exists) throw new ConflictException('Slug already exists');
    }

    // Store current image for cleanup
    let previousImage = null;
    if (updateSolutionDto.featuredImage) {
      previousImage = solution.featuredImage;
    }

    // Update basic solution data
    Object.assign(solution, updateSolutionDto);

    const savedSolution = await this.solutionRepository.save(solution);

    if (previousImage) {
      this.uploadService.deleteFiles([previousImage]);
    }

    // Reload with relationships for response
    return this.getById(savedSolution.id);
  }

  async delete(id: number): Promise<void> {
    const solution = await this.solutionRepository.findOne({ where: { id } });

    if (!solution) {
      throw new NotFoundException('Solution not found');
    }

    if (solution.featuredImage) {
      await this.uploadService.deleteFiles([solution.featuredImage]);
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

    const qb = this.buildBaseQB(languageCode).andWhere('solution.isPublished = :isPublished', { isPublished: true });

    // Apply additional filters if provided
    if (filter) {
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
    } else {
      qb.orderBy('solution.order', 'ASC').addOrderBy('solution.createdAt', 'DESC');
    }

    // Get paginated results with raw entities
    return paginate(qb, filter, SolutionResponseDto);
  }

  async getFeaturedSolutions(filter: PublicSolutionFilterDto): Promise<PaginationResponseDto<SolutionResponseDto>> {
    const languageCode = filter.lang;
    await this.languagesService.ensureLanguageExists(languageCode);

    const qb = this.buildBaseQB(languageCode)
      .andWhere('solution.isFeatured = :isFeatured', { isFeatured: true })
      .andWhere('solution.isPublished = :isPublished', { isPublished: true });

    // Apply additional filters if provided
    if (filter) {
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
    } else {
      qb.orderBy('solution.order', 'ASC').addOrderBy('solution.createdAt', 'DESC');
    }

    // Get paginated results with raw entities
    return paginate(qb, filter, SolutionResponseDto);
  }

  async getBySlugPublic(slug: string, languageCode: string): Promise<SolutionResponseDto> {
    await this.languagesService.ensureLanguageExists(languageCode);

    const solution = await this.buildBaseQB(languageCode)
      .andWhere('solution.slug = :slug', { slug })
      .andWhere('solution.isPublished = :isPublished', { isPublished: true })
      .andWhere('translations.languageCode = :languageCode', { languageCode })
      .getOne();

    if (!solution) throw new NotFoundException('Solution not found');

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

    qb.orderBy('solution.order', 'ASC').addOrderBy('solution.createdAt', 'DESC');

    return qb;
  }
}
