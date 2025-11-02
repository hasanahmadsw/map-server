import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreateServiceDto } from '../dtos/request/create-service.dto';
import { UpdateServiceDto } from '../dtos/request/update-service.dto';
import { ServiceResponseDto } from '../dtos/response/service-response.dto';
import { ServiceFilterDto } from '../dtos/query/service-filter.dto';
import { ServiceEntity } from '../entities/service.entity';
import { ServiceTranslationEntity } from '../entities/service-translation.entity';
import { SolutionEntity } from '../../solutions/entities/solution.entity';
import { paginate } from 'src/common/pagination/paginate.service';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { PublicServiceFilterDto } from '../dtos/query/public-service-filter.dto';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { UploadService } from 'src/shared/modules/upload/services/upload.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(SolutionEntity)
    private readonly solutionRepository: Repository<SolutionEntity>,
    private readonly translateService: TranslateService,
    private readonly languagesService: LanguagesService,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
  ) {}

  async uploadPicture(picture: Express.Multer.File): Promise<{ url: string }> {
    const url = await this.uploadService.uploadPicture(picture);
    return { url };
  }

  async create(createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    const { languageCode, name, description, shortDescription, meta, subServices, solutionIds, ...serviceData } =
      createServiceDto;

    // slug must be unique
    const exists = await this.serviceRepository.exist({ where: { slug: serviceData.slug } });
    if (exists) throw new ConflictException('Slug already exists');

    // ensure the languages exist
    await this.languagesService.ensureLanguagesExist([...createServiceDto.translateTo, languageCode]);

    // omit the default language code
    const translateTo = createServiceDto.translateTo.filter((code) => code !== languageCode);

    // language must exist
    await this.languagesService.ensureLanguageExists(languageCode);

    const id = await this.dataSource.transaction(async (trx) => {
      // Create the service
      const service = trx.getRepository(ServiceEntity).create({
        slug: serviceData.slug,
        isPublished: serviceData.isPublished ?? false,
        isFeatured: serviceData.isFeatured ?? false,
        featuredImage: serviceData.featuredImage,
        viewCount: 0,
        icon: serviceData.icon,
        order: serviceData.order ?? 0,
      });
      const savedService = await trx.getRepository(ServiceEntity).save(service);

      // Create the default translation
      const translation = trx.getRepository(ServiceTranslationEntity).create({
        serviceId: savedService.id,
        languageCode: languageCode,
        name,
        description: description ?? null,
        shortDescription: shortDescription ?? null,
        meta: meta ?? null,
        subServices: subServices ?? null,
        isDefault: true,
      });
      await trx.getRepository(ServiceTranslationEntity).save(translation);

      // Associate solutions if provided
      if (solutionIds && solutionIds.length > 0) {
        const solutions = await trx.getRepository(SolutionEntity).findBy({ id: In(solutionIds) });
        savedService.solutions = solutions;
        await trx.getRepository(ServiceEntity).save(savedService);
      }

      return savedService.id;
    });

    if (translateTo.length > 0) {
      this.translateService.translateToLanguages(translateTo, TranslationEventTypes.service, id, {
        name,
        description,
        shortDescription,
        meta,
        subServices,
      });
    }

    return this.getById(id);
  }

  async findAll(filterServiceDto: ServiceFilterDto): Promise<PaginationResponseDto<ServiceResponseDto>> {
    const qb = this.buildBaseQB();

    // Search by slug or translation content
    if (filterServiceDto.search) {
      qb.andWhere('translations.name ILIKE :search', { search: `%${filterServiceDto.search}%` });
    }

    // Filter by slug
    if (filterServiceDto.slug) {
      qb.andWhere('service.slug = :slug', { slug: filterServiceDto.slug });
    }

    // Filter by published status
    if (filterServiceDto.isPublished !== undefined) {
      qb.andWhere('service.isPublished = :isPublished', {
        isPublished: filterServiceDto.isPublished,
      });
    }

    // Filter by featured status
    if (filterServiceDto.isFeatured !== undefined) {
      qb.andWhere('service.isFeatured = :isFeatured', {
        isFeatured: filterServiceDto.isFeatured,
      });
    }

    // Filter by language
    if (filterServiceDto.languageCode) {
      qb.andWhere('translations.languageCode = :languageCode', { languageCode: filterServiceDto.languageCode });
    }

    // Filter by order
    if (filterServiceDto.order !== undefined) {
      qb.andWhere('service.order = :order', { order: filterServiceDto.order });
    }

    // Filter by solution
    if (filterServiceDto.solutionId !== undefined) {
      qb.andWhere('solutions.id = :solutionId', { solutionId: filterServiceDto.solutionId });
    }

    // Sorting
    if (filterServiceDto.sortBy) {
      const sortOrder = filterServiceDto.sortOrder || 'ASC';
      qb.orderBy(`service.${filterServiceDto.sortBy}`, sortOrder);
    } else {
      qb.orderBy('service.order', 'ASC').addOrderBy('service.createdAt', 'DESC');
    }

    return paginate(qb, filterServiceDto, ServiceResponseDto);
  }

  async getById(id: number): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['translations', 'solutions', 'solutions.translations'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return plainToInstance(ServiceResponseDto, service, { enableImplicitConversion: true });
  }

  async findBySlug(slug: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { slug },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Increment view count
    service.viewCount += 1;
    await this.serviceRepository.save(service);

    return service;
  }

  async update(id: number, updateServiceDto: UpdateServiceDto): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { id }, relations: ['translations', 'solutions'] });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // if slug changes, enforce uniqueness
    if (updateServiceDto.slug && updateServiceDto.slug !== service.slug) {
      const exists = await this.serviceRepository.exist({ where: { slug: updateServiceDto.slug } });
      if (exists) throw new ConflictException('Slug already exists');
    }

    // Store current image for cleanup
    let previousImage = null;
    if (updateServiceDto.featuredImage) {
      previousImage = service.featuredImage;
    }

    // Handle solution associations
    if (updateServiceDto.solutionIds !== undefined) {
      const solutions = await this.solutionRepository.findBy({ id: In(updateServiceDto.solutionIds) });
      service.solutions = solutions;
    }

    // Update basic service data
    const { solutionIds, ...serviceData } = updateServiceDto;
    Object.assign(service, serviceData);

    const savedService = await this.serviceRepository.save(service);

    if (previousImage) {
      this.uploadService.deleteFiles([previousImage]);
    }

    // Reload with relationships for response
    return this.getById(savedService.id);
  }

  async delete(id: number): Promise<void> {
    const service = await this.serviceRepository.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.featuredImage) {
      await this.uploadService.deleteFiles([service.featuredImage]);
    }

    await this.serviceRepository.delete(id);
  }

  async publish(id: number): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    service.isPublished = true;
    const savedService = await this.serviceRepository.save(service);

    return this.getById(savedService.id);
  }

  async unpublish(id: number): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    service.isPublished = false;
    const savedService = await this.serviceRepository.save(service);

    return this.getById(savedService.id);
  }

  async toggleFeatured(id: number): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    service.isFeatured = !service.isFeatured;
    const savedService = await this.serviceRepository.save(service);

    return this.getById(savedService.id);
  }

  async getPublishedServices(filter: PublicServiceFilterDto): Promise<PaginationResponseDto<ServiceResponseDto>> {
    const languageCode = filter.lang;
    await this.languagesService.ensureLanguageExists(languageCode);

    const qb = this.buildBaseQB(languageCode).andWhere('service.isPublished = :isPublished', { isPublished: true });

    // Apply additional filters if provided
    if (filter) {
      if (filter.search) {
        qb.andWhere('translations.name ILIKE :search', { search: `%${filter.search}%` });
      }

      if (filter.isFeatured !== undefined) {
        qb.andWhere('service.isFeatured = :isFeatured', { isFeatured: filter.isFeatured });
      }

      if (filter.order !== undefined) {
        qb.andWhere('service.order = :order', { order: filter.order });
      }

      if (filter.sortBy) {
        const sortOrder = filter.sortOrder || 'ASC';
        qb.orderBy(`service.${filter.sortBy}`, sortOrder);
      } else {
        qb.orderBy('service.order', 'ASC').addOrderBy('service.createdAt', 'DESC');
      }
    } else {
      qb.orderBy('service.order', 'ASC').addOrderBy('service.createdAt', 'DESC');
    }

    // Get paginated results with raw entities
    return paginate(qb, filter, ServiceResponseDto);
  }

  async getFeaturedServices(filter: PublicServiceFilterDto): Promise<PaginationResponseDto<ServiceResponseDto>> {
    const languageCode = filter.lang;
    await this.languagesService.ensureLanguageExists(languageCode);

    const qb = this.buildBaseQB(languageCode)
      .andWhere('service.isFeatured = :isFeatured', { isFeatured: true })
      .andWhere('service.isPublished = :isPublished', { isPublished: true });

    // Apply additional filters if provided
    if (filter) {
      if (filter.search) {
        qb.andWhere('translations.name ILIKE :search', { search: `%${filter.search}%` });
      }

      if (filter.order !== undefined) {
        qb.andWhere('service.order = :order', { order: filter.order });
      }

      if (filter.sortBy) {
        const sortOrder = filter.sortOrder || 'ASC';
        qb.orderBy(`service.${filter.sortBy}`, sortOrder);
      } else {
        qb.orderBy('service.order', 'ASC').addOrderBy('service.createdAt', 'DESC');
      }
    } else {
      qb.orderBy('service.order', 'ASC').addOrderBy('service.createdAt', 'DESC');
    }

    // Get paginated results with raw entities
    return paginate(qb, filter, ServiceResponseDto);
  }

  async getBySlugPublic(slug: string, languageCode: string): Promise<ServiceResponseDto> {
    await this.languagesService.ensureLanguageExists(languageCode);

    const service = await this.buildBaseQB(languageCode)
      .andWhere('service.slug = :slug', { slug })
      .andWhere('service.isPublished = :isPublished', { isPublished: true })
      .andWhere('translations.languageCode = :languageCode', { languageCode })
      .getOne();

    if (!service) throw new NotFoundException('Service not found');

    // Increment view count without saving relations
    await this.serviceRepository.update(service.id, { viewCount: service.viewCount + 1 });

    return service;
  }

  // ---------- Helpers ----------
  private buildBaseQB(languageCode?: string): SelectQueryBuilder<ServiceEntity> {
    const qb = this.serviceRepository.createQueryBuilder('service');

    if (languageCode) {
      qb.innerJoinAndSelect('service.translations', 'translations', 'translations.languageCode = :languageCode', {
        languageCode,
      });
    } else {
      qb.leftJoinAndSelect('service.translations', 'translations');
    }

    qb.leftJoinAndSelect('service.solutions', 'solutions')
      .leftJoinAndSelect('solutions.translations', 'solutionTranslations');

    qb.orderBy('service.order', 'ASC').addOrderBy('service.createdAt', 'DESC');

    return qb;
  }
}
