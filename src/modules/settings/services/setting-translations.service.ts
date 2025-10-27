import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SettingTranslationEntity } from '../entities/setting-translation.entity';
import { SettingEntity } from '../entities/setting.entity';
import { CreateSettingTranslationDto } from '../dtos/request/create-setting-translation.dto';
import { UpdateSettingTranslationDto } from '../dtos/request/update-setting-translation.dto';
import { SettingTranslationResponseDto } from '../dtos/response/setting-translation-response.dto';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';

@Injectable()
export class SettingTranslationsService {
  constructor(
    @InjectRepository(SettingTranslationEntity)
    private readonly translationRepository: Repository<SettingTranslationEntity>,
    @InjectRepository(SettingEntity)
    private readonly settingRepository: Repository<SettingEntity>,
    private readonly languagesService: LanguagesService,
    private readonly translateService: TranslateService,
  ) {}

  async create(createTranslationDto: CreateSettingTranslationDto): Promise<SettingTranslationResponseDto> {
    // Check if setting exists (there should only be one)
    const setting = await this.getSingleSettingsRecord();

    // Check if translation already exists for this language
    const existingTranslation = await this.translationRepository.findOne({
      where: { languageCode: createTranslationDto.languageCode },
    });

    if (existingTranslation) {
      throw new ConflictException('Translation already exists for this language');
    }

    await this.languagesService.ensureLanguageExists(createTranslationDto.languageCode);

    const translation = this.translationRepository.create(createTranslationDto);
    const savedTranslation = await this.translationRepository.save(translation);
    return savedTranslation;
  }

  async findAllBySetting(): Promise<SettingTranslationResponseDto[]> {
    const translations = await this.translationRepository.find({
      relations: ['language'],
    });

    return translations;
  }

  async findOne(id: number): Promise<SettingTranslationResponseDto> {
    const translation = await this.translationRepository.findOne({
      where: { id },
      relations: ['language'],
    });

    if (!translation) {
      throw new NotFoundException('Setting translation not found');
    }

    return translation;
  }

  async findByLanguage(languageCode: string): Promise<SettingTranslationResponseDto> {
    const translation = await this.translationRepository.findOne({
      where: { languageCode },
      relations: ['language'],
    });

    if (!translation) {
      throw new NotFoundException(`Translation not found for language: ${languageCode}`);
    }

    return translation;
  }

  async findAllTranslations(): Promise<SettingTranslationResponseDto[]> {
    const translations = await this.translationRepository.find({
      relations: ['language'],
    });

    return translations;
  }

  async createAutoTranslation(autoTranslateDto: AutoTranslateDto): Promise<SettingTranslationResponseDto[]> {
    const settings = await this.getSingleSettingsRecord();

    const translateTo = autoTranslateDto.translateTo;
    await this.languagesService.ensureLanguagesExist(translateTo);

    const existingTranslations = await this.translationRepository.find({
      where: { languageCode: In(translateTo) },
    });
    if (existingTranslations.length > 0) {
      const existingCodes = existingTranslations.map((t) => t.languageCode);
      throw new ConflictException(
        `Some translations already exist for the specified languages: ${existingCodes.join(', ')}`,
      );
    }

    await this.translateService.translateToLanguages(translateTo, TranslationEventTypes.setting, settings.id, {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      siteLogo: settings.siteLogo,
      siteDarkLogo: settings.siteDarkLogo,
      meta: settings.meta,
    });

    return this.translationRepository.find();
  }

  async update(id: number, updateTranslationDto: UpdateSettingTranslationDto): Promise<SettingTranslationResponseDto> {
    const translation = await this.translationRepository.findOne({ where: { id } });

    if (!translation) {
      throw new NotFoundException('Setting translation not found');
    }

    const updatedTranslation = this.translationRepository.merge(translation, updateTranslationDto);
    const savedTranslation = await this.translationRepository.save(updatedTranslation);

    return savedTranslation;
  }

  async delete(id: number): Promise<void> {
    const result = await this.translationRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Setting translation not found');
    }
  }

  private async getSingleSettingsRecord(): Promise<SettingEntity> {
    const settings = await this.settingRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (!settings || settings.length === 0) {
      throw new NotFoundException('No settings found');
    }

    return settings[0];
  }
}
