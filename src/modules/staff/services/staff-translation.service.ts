import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StaffTranslationEntity } from '../entities/staff-translation.entity';
import { StaffEntity } from '../entities/staff.entity';
import { CreateStaffTranslationDto } from '../dtos/request/create-staff-translation.dto';
import { UpdateStaffTranslationDto } from '../dtos/request/update-staff-translation.dto';
import { StaffTranslationResponseDto } from '../dtos/response/staff-translation-response.dto';
import { plainToInstance } from 'class-transformer';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { UploadService } from 'src/shared/modules/upload/services/upload.service';

@Injectable()
export class StaffTranslationService {
  constructor(
    @InjectRepository(StaffTranslationEntity) private readonly translationsRepo: Repository<StaffTranslationEntity>,
    @InjectRepository(StaffEntity) private readonly staffRepo: Repository<StaffEntity>,
    private readonly languagesService: LanguagesService,
    private readonly translateService: TranslateService,
  ) {}

  async create(staffId: number, dto: CreateStaffTranslationDto): Promise<StaffTranslationResponseDto> {
    const staffExists = await this.staffRepo.exist({ where: { id: staffId } });
    if (!staffExists) throw new NotFoundException('Staff not found');

    const exists = await this.translationsRepo.exist({
      where: { staffId, languageCode: dto.languageCode },
    });
    if (exists) throw new ConflictException('Translation already exists for this staff and language');

    await this.languagesService.ensureLanguageExists(dto.languageCode);

    const saved = await this.translationsRepo.save(this.translationsRepo.create({ ...dto, staffId }));
    return this.getById(saved.id);
  }

  async listByStaff(staffId: number): Promise<StaffTranslationResponseDto[]> {
    const translations = await this.translationsRepo.find({ where: { staffId }, relations: ['language'] });
    return translations.map((t) => plainToInstance(StaffTranslationResponseDto, t, { enableImplicitConversion: true }));
  }

  async getById(id: number): Promise<StaffTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({ where: { id }, relations: ['language'] });
    if (!translation) throw new NotFoundException('Staff translation not found');
    return plainToInstance(StaffTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async getByStaffAndLanguage(staffId: number, languageCode: string): Promise<StaffTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({
      where: { staffId, languageCode },
      relations: ['language'],
    });
    if (!translation)
      throw new NotFoundException(`Translation not found for staff ${staffId} and language ${languageCode}`);
    return plainToInstance(StaffTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async listAll(): Promise<StaffTranslationResponseDto[]> {
    const translations = await this.translationsRepo.find({ relations: ['language'] });
    return translations.map((t) => plainToInstance(StaffTranslationResponseDto, t, { enableImplicitConversion: true }));
  }

  async autoTranslate(staffId: number, dto: AutoTranslateDto): Promise<StaffTranslationResponseDto[]> {
    const staff = await this.staffRepo.findOne({ where: { id: staffId } });
    if (!staff) throw new NotFoundException('Staff not found');

    const translateTo = dto.translateTo;
    await this.languagesService.ensureLanguagesExist(translateTo);

    const existingTranslations = await this.translationsRepo.find({
      where: { staffId, languageCode: In(translateTo) },
    });
    if (existingTranslations.length > 0) {
      const existingCodes = existingTranslations.map((t) => t.languageCode);
      throw new ConflictException(
        `Some translations already exist for the specified languages: ${existingCodes.join(', ')}`,
      );
    }

    const defaultTranslation = await this.translationsRepo.findOne({ where: { staffId, isDefault: true } });
    if (!defaultTranslation) throw new NotFoundException('Default translation not found');

    await this.translateService.translateToLanguages(translateTo, TranslationEventTypes.staff, staffId, {
      name: defaultTranslation.name,
      bio: defaultTranslation.bio,
    });

    return this.translationsRepo.find({ where: { staffId } });
  }

  async update(id: number, staffId: number, dto: UpdateStaffTranslationDto): Promise<StaffTranslationResponseDto> {
    const existing = await this.translationsRepo.findOne({ where: { id, staffId } });
    if (!existing) throw new NotFoundException('Staff translation not found');

    const saved = await this.translationsRepo.save(this.translationsRepo.merge(existing, dto));
    return this.getById(saved.id);
  }

  async remove(id: number, staffId: number): Promise<void> {
    const translation = await this.translationsRepo.findOne({ where: { id, staffId } });
    if (!translation) throw new NotFoundException('Staff translation not found');

    if (translation.isDefault) throw new BadRequestException('Default translation cannot be deleted');

    await this.translationsRepo.delete(id);
  }
}
