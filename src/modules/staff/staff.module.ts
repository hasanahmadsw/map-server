import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffController } from './controllers/staff.controller';
import { StaffService } from './services/staff.service';
import { StaffTranslationService } from './services/staff-translation.service';
import { StaffEntity } from './entities/staff.entity';
import { StaffTranslationEntity } from './entities/staff-translation.entity';
import { AppJwtModule } from 'src/shared/modules/jwt/jwt.module';
import { LanguagesModule } from 'src/modules/languages/languages.module';
import { TranslationModule } from 'src/services/translation/translation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffEntity, StaffTranslationEntity]),
    AppJwtModule,
    LanguagesModule,
    TranslationModule,
  ],
  controllers: [StaffController],
  providers: [StaffService, StaffTranslationService],
  exports: [StaffService, StaffTranslationService],
})
export class StaffModule {}
