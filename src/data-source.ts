import 'reflect-metadata';
import 'tsconfig-paths/register';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { ENV_FILES, Environment } from './shared/modules/config/env.constant';
// Load environment variables using the same logic as ConfigModule
const envFile = ENV_FILES.getEnvFile(process.env.NODE_ENV) || ENV_FILES.DEVELOPMENT;
config({ path: resolve(process.cwd(), `env/${envFile}`) });

const isDev = process.env.NODE_ENV !== Environment.PRODUCTION;

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/**/*{.ts,.js}'],
  synchronize: false, // Always false for migrations
  logging: isDev,
  ...(!isDev
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {}),
});
