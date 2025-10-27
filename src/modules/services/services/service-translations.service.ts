import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ServiceTranslationEntity } from '../entities/service-translation.entity';
import { ServiceEntity } from '../entities/service.entity';
import { CreateServiceTranslationDto } from '../dtos/request/create-service-translation.dto';
import { UpdateServiceTranslationDto } from '../dtos/request/update-service-translation.dto';
import { ServiceTranslationResponseDto } from '../dtos/response/service-translation-response.dto';
import { plainToInstance } from 'class-transformer';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';

@Injectable()
export class ServiceTranslationsService {
  constructor(
    @InjectRepository(ServiceTranslationEntity) private readonly translationsRepo: Repository<ServiceTranslationEntity>,
    @InjectRepository(ServiceEntity) private readonly servicesRepo: Repository<ServiceEntity>,
    private readonly languagesService: LanguagesService,
    private readonly translateService: TranslateService,
  ) {}

  async create(serviceId: number, dto: CreateServiceTranslationDto): Promise<ServiceTranslationResponseDto> {
    const serviceExists = await this.servicesRepo.exist({ where: { id: serviceId } });
    if (!serviceExists) throw new NotFoundException('Service not found');

    const exists = await this.translationsRepo.exist({
      where: { serviceId, languageCode: dto.languageCode },
    });
    if (exists) throw new ConflictException('Translation already exists for this service and language');

    await this.languagesService.ensureLanguageExists(dto.languageCode);

    const saved = await this.translationsRepo.save(this.translationsRepo.create({ ...dto, serviceId }));
    return this.getById(saved.id);
  }

  async listByService(serviceId: number): Promise<ServiceTranslationResponseDto[]> {
    // ensure that the service exists
    const serviceExists = await this.servicesRepo.exist({ where: { id: serviceId } });
    if (!serviceExists) throw new NotFoundException('Service not found');

    const translations = await this.translationsRepo.find({ where: { serviceId }, relations: ['language'] });
    return translations.map((t) =>
      plainToInstance(ServiceTranslationResponseDto, t, { enableImplicitConversion: true }),
    );
  }

  async getById(id: number): Promise<ServiceTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({ where: { id }, relations: ['language'] });
    if (!translation) throw new NotFoundException('Service translation not found');
    return plainToInstance(ServiceTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async getByServiceAndLanguage(serviceId: number, languageCode: string): Promise<ServiceTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({
      where: { serviceId, languageCode },
      relations: ['language'],
    });
    if (!translation)
      throw new NotFoundException(`Translation not found for service ${serviceId} and language ${languageCode}`);
    return plainToInstance(ServiceTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async listAll(): Promise<ServiceTranslationResponseDto[]> {
    const translations = await this.translationsRepo.find({ relations: ['language'] });
    return translations.map((t) =>
      plainToInstance(ServiceTranslationResponseDto, t, { enableImplicitConversion: true }),
    );
  }

  async autoTranslate(serviceId: number, dto: AutoTranslateDto): Promise<ServiceTranslationResponseDto[]> {
    const service = await this.servicesRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');

    const translateTo = dto.translateTo;

    // ensure the languages exist
    await this.languagesService.ensureLanguagesExist(translateTo);

    // For each language, if a translation exists for this service, delete it
    const existingTranslations = await this.translationsRepo.find({
      where: { serviceId, languageCode: In(translateTo) },
    });
    if (existingTranslations.length > 0) {
      const existingCodes = existingTranslations.map((t) => t.languageCode);
      throw new ConflictException(
        `Some translations already exist for the specified languages: ${existingCodes.join(', ')}`,
      );
    }

    // get the default translation of this service
    const defaultTranslation = await this.translationsRepo.findOne({ where: { serviceId, isDefault: true } });
    if (!defaultTranslation) throw new NotFoundException('Default translation not found');

    // translate the service
    await this.translateService.translateToLanguages(translateTo, TranslationEventTypes.service, serviceId, {
      name: defaultTranslation.name,
      description: defaultTranslation.description,
      shortDescription: defaultTranslation.shortDescription,
      meta: defaultTranslation.meta,
      subServices: defaultTranslation.subServices,
    });

    return this.translationsRepo.find({ where: { serviceId } });
  }

  async update(
    id: number,
    serviceId: number,
    dto: UpdateServiceTranslationDto,
  ): Promise<ServiceTranslationResponseDto> {
    const existing = await this.translationsRepo.findOne({ where: { id, serviceId } });
    if (!existing) throw new NotFoundException('Service translation not found');

    const saved = await this.translationsRepo.save(this.translationsRepo.merge(existing, dto));
    return this.getById(saved.id);
  }

  async remove(id: number, serviceId: number): Promise<void> {
    const translation = await this.translationsRepo.findOne({ where: { id, serviceId } });
    if (!translation) throw new NotFoundException('Service translation not found');

    if (translation.isDefault) throw new BadRequestException('Default translation cannot be deleted');

    await this.translationsRepo.delete(id);
  }
}
