import { Controller, Get, Post, Body, Patch, Delete, Query, HttpStatus, HttpCode, Param } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { SettingTranslationsService } from '../services/setting-translations.service';
import { CreateSettingDto } from '../dtos/request/create-setting.dto';
import { UpdateSettingDto } from '../dtos/request/update-setting.dto';
import { CreateSettingTranslationDto } from '../dtos/request/create-setting-translation.dto';
import { UpdateSettingTranslationDto } from '../dtos/request/update-setting-translation.dto';
import { SettingResponseDto } from '../dtos/response/setting-response.dto';
import { SettingsWithTranslationsResponseDto } from '../dtos/response/settings-with-translations-response.dto';
import { SettingTranslationResponseDto } from '../dtos/response/setting-translation-response.dto';
import { SerializeResponse } from 'src/common/decorators/serialize-response.decorator';
import { Protected } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { PositiveIntPipe } from 'src/common/pipes/positive-int.pipe';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';
import { LanguageCodePipe } from 'src/common/pipes/language-code.pipe';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly translationsService: SettingTranslationsService,
  ) {}

  @Post()
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(SettingResponseDto)
  create(@Body() createSettingDto: CreateSettingDto): Promise<SettingResponseDto> {
    return this.settingsService.create(createSettingDto);
  }

  @Post('initialize')
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(SettingResponseDto)
  initializeSettings(): Promise<SettingResponseDto> {
    return this.settingsService.initializeDefaultSettings();
  }

  @Get()
  @SerializeResponse(SettingResponseDto)
  getSettings(@Query('lang', LanguageCodePipe) languageCode?: string): Promise<SettingResponseDto> {
    return this.settingsService.getSettings(languageCode);
  }

  @Get('translations')
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(SettingsWithTranslationsResponseDto)
  getSettingsWithAllTranslations(): Promise<SettingsWithTranslationsResponseDto> {
    return this.settingsService.getSettingsWithAllTranslations();
  }

  @Patch()
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(SettingResponseDto)
  update(@Body() updateSettingDto: UpdateSettingDto): Promise<SettingResponseDto> {
    return this.settingsService.update(updateSettingDto);
  }

  // Translation endpoints
  @Post('translations')
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(SettingTranslationResponseDto)
  createTranslation(@Body() createTranslationDto: CreateSettingTranslationDto): Promise<SettingTranslationResponseDto> {
    return this.translationsService.create(createTranslationDto);
  }

  @Post('translations/auto')
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(SettingTranslationResponseDto)
  createAutoTranslation(@Body() createTranslationDto: AutoTranslateDto): Promise<SettingTranslationResponseDto[]> {
    return this.translationsService.createAutoTranslation(createTranslationDto);
  }

  @Get('translations/:languageCode')
  @SerializeResponse(SettingTranslationResponseDto)
  findTranslationByLanguage(@Param('languageCode') languageCode: string): Promise<SettingTranslationResponseDto> {
    return this.translationsService.findByLanguage(languageCode);
  }

  @Patch('translations/:translationId')
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(SettingTranslationResponseDto)
  updateTranslation(
    @Param('translationId', PositiveIntPipe) translationId: number,
    @Body() updateTranslationDto: UpdateSettingTranslationDto,
  ): Promise<SettingTranslationResponseDto> {
    return this.translationsService.update(translationId, updateTranslationDto);
  }

  @Delete('translations/:translationId')
  @Protected(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTranslation(@Param('translationId', PositiveIntPipe) translationId: number): Promise<void> {
    this.translationsService.delete(translationId);
  }
}
