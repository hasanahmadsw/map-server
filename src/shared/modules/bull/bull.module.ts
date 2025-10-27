import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from '../config/env.schema';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    // BullModule.forRootAsync({
    //   imports: [AppConfigModel],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService<EnvironmentConfig, true>) => ({
    //     connection: {
    //       url: configService.getOrThrow('REDIS_URL'),
    //       maxRetriesPerRequest: 1,
    //       enableReadyCheck: false,
    //     },
    //   }),
    // }),
  ],
  exports: [BullModule],
})
export class BullMQModule {}
