import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';
import { SettingTranslationsService } from './services/setting-translations.service';
import { SettingEntity } from './entities/setting.entity';
import { SettingTranslationEntity } from './entities/setting-translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SettingEntity, SettingTranslationEntity])],
  controllers: [SettingsController],
  providers: [SettingsService, SettingTranslationsService],
  exports: [SettingsService, SettingTranslationsService],
})
export class SettingsModule {}