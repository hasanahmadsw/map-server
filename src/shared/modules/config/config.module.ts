import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ENV_FILES } from './env.constant';
import { EnvironmentValidator } from './env.validator';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: EnvironmentValidator.validate,
      envFilePath: ['env/' + (ENV_FILES.getEnvFile(process.env.NODE_ENV) || ENV_FILES.DEVELOPMENT)],
    }),
  ],

  exports: [],
})
export class ConfigModule {}
