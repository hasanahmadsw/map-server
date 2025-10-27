import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorHandlerFactory } from './shared/exceptions-filter/error-handler.factory';
import { GlobalExceptionFilter } from './shared/exceptions-filter/global-exception.filter';
import { ConfigModule } from './shared/modules/config/config.module';
import { DatabaseModule } from './shared/modules/typeorm/typeorm.module';
import { AppJwtModule } from './shared/modules/jwt/jwt.module';
import { StaffModule } from './modules/staff/staff.module';
import { SettingsModule } from './modules/settings/settings.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { TranslationModule } from './services/translation/translation.module';
import { UploadModule } from './shared/modules/upload/upload.module';
import { SupabaseModule } from './services/supabase/supabase.module';
import { ServicesModule } from './modules/services/services.module';
import { SolutionsModule } from './modules/solutions/solutions.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AppJwtModule,
    UploadModule,
    SupabaseModule,
    StaffModule,
    SettingsModule,
    LanguagesModule,
    ArticlesModule,
    TranslationModule,
    ServicesModule,
    SolutionsModule,
    ProjectsModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    ErrorHandlerFactory,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
