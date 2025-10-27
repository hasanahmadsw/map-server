import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSettingDto } from '../dtos/request/create-setting.dto';
import { UpdateSettingDto } from '../dtos/request/update-setting.dto';
import { SettingResponseDto } from '../dtos/response/setting-response.dto';
import { SettingsWithTranslationsResponseDto } from '../dtos/response/settings-with-translations-response.dto';
import { SettingEntity } from '../entities/setting.entity';
import { SettingTranslationEntity } from '../entities/setting-translation.entity';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingEntity)
    private readonly settingRepository: Repository<SettingEntity>,
    @InjectRepository(SettingTranslationEntity)
    private readonly translationRepository: Repository<SettingTranslationEntity>,
    private readonly languagesService: LanguagesService,
    private readonly translateService: TranslateService,
  ) {}

  async create(createSettingDto: CreateSettingDto): Promise<SettingResponseDto> {
    // Check if settings already exist
    const existingSettings = await this.settingRepository.count();
    if (existingSettings > 0) {
      throw new Error('Settings already exist. Only one settings row is allowed.');
    }

    const setting = this.settingRepository.create(createSettingDto);
    const savedSetting = await this.settingRepository.save(setting);

    const languages = await this.languagesService.findAll();

    await this.translateService.translateToLanguages(
      languages.map((lang) => lang.code),
      TranslationEventTypes.setting,
      savedSetting.id,
      {
        siteName: savedSetting.siteName,
        siteDescription: savedSetting.siteDescription,
        siteLogo: savedSetting.siteLogo,
        siteDarkLogo: savedSetting.siteDarkLogo,
        meta: savedSetting.meta,
      },
    );

    return savedSetting;
  }

  async findOne(id: number): Promise<SettingResponseDto> {
    const setting = await this.settingRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }

  async getSettings(languageCode?: string): Promise<SettingResponseDto> {
    // Get the main settings record (there should only be one)
    const setting = await this.getSingleSettingsRecord();

    // If no language specified, use default language
    if (!languageCode) {
      languageCode = setting.defaultLanguage;
    }

    // Find translation for the requested language
    let translation = await this.translationRepository.findOne({
      where: { languageCode },
      relations: ['language'],
    });

    // If translation doesn't exist, fallback to default language
    if (!translation && languageCode !== setting.defaultLanguage) {
      translation = await this.translationRepository.findOne({
        where: { languageCode: setting.defaultLanguage },
        relations: ['language'],
      });
    }

    // Merge settings with translation (selective overrides)
    return this.mergeSettingsWithTranslation(setting, translation);
  }

  async getSettingsWithAllTranslations(): Promise<SettingsWithTranslationsResponseDto> {
    const setting = await this.getSingleSettingsRecord();

    // Get all translations
    const translations = await this.translationRepository.find({
      relations: ['language'],
    });

    return {
      ...setting,
      translations,
    };
  }

  async getSettingsByLanguage(languageCode: string): Promise<SettingResponseDto> {
    return this.getSettings(languageCode);
  }

  async initializeDefaultSettings(): Promise<SettingResponseDto> {
    // Check if settings already exist
    const existingSettings = await this.settingRepository.count();
    if (existingSettings > 0) {
      return this.getSettings();
    }

    // Create default settings
    const defaultSettings: CreateSettingDto = {
      siteName: 'My Application',
      siteDescription: 'Default application settings',
      siteLogo: '/default-logo.png',
      siteDarkLogo: '/default-dark-logo.png',
      siteFavicon: '/default-favicon.ico',
      meta: {
        title: 'My Application',
        description: 'Default application settings',
        keywords: ['default', 'application', 'settings'],
      },
      social: [],
      analytics: {},
      contact: {},
      customScripts: {},
    };

    return this.create(defaultSettings);
  }

  async update(updateSettingDto: UpdateSettingDto): Promise<SettingResponseDto> {
    // Get the single settings record (there should only be one)
    const setting = await this.getSingleSettingsRecord();

    const updatedSetting = this.settingRepository.merge(setting, updateSettingDto);
    await this.settingRepository.save(updatedSetting);

    // Reload with relations
    return this.getSettings();
  }

  /**
   * Helper method to get the single settings record
   * Since there should only be one settings record, we use find with take: 1
   */
  private async getSingleSettingsRecord(): Promise<SettingEntity> {
    const settings = await this.settingRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });

    if (!settings || settings.length === 0) {
      throw new NotFoundException('No settings found. Please create settings first.');
    }

    return settings[0];
  }

  private mergeSettingsWithTranslation(
    setting: SettingEntity,
    translation?: SettingTranslationEntity,
  ): SettingResponseDto {
    // Start with base settings
    const mergedSettings: SettingResponseDto = {
      id: setting.id,
      siteName: setting.siteName,
      siteDescription: setting.siteDescription,
      siteLogo: setting.siteLogo,
      siteDarkLogo: setting.siteDarkLogo,
      siteFavicon: setting.siteFavicon,
      meta: setting.meta,
      social: setting.social,
      analytics: setting.analytics,
      contact: setting.contact,
      customScripts: setting.customScripts,
      defaultLanguage: setting.defaultLanguage,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };

    // Apply translation overrides only for translatable fields
    if (translation) {
      if (translation.siteName) {
        mergedSettings.siteName = translation.siteName;
      }
      if (translation.siteDescription) {
        mergedSettings.siteDescription = translation.siteDescription;
      }
      if (translation.siteLogo) {
        mergedSettings.siteLogo = translation.siteLogo;
      }
      if (translation.siteDarkLogo) {
        mergedSettings.siteDarkLogo = translation.siteDarkLogo;
      }
      if (translation.meta) {
        mergedSettings.meta = {
          ...mergedSettings.meta,
          ...translation.meta,
        };
      }
    }

    return mergedSettings;
  }
}
