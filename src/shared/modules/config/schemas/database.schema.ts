import { z } from 'zod';

export const databaseSchema = z.object({
  // PostgreSQL Configuration
  POSTGRES_HOST: z.string().min(1, 'POSTGRES_HOST is required'),

  POSTGRES_PORT: z.string().min(1, 'POSTGRES_PORT is required'),

  POSTGRES_USER: z.string().min(1, 'POSTGRES_USER is required'),

  POSTGRES_PASSWORD: z.string().min(1, 'POSTGRES_PASSWORD is required'),

  POSTGRES_DATABASE: z.string().min(1, 'POSTGRES_DATABASE is required'),

  // Redis Configuration
  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required'),

  REDIS_PORT: z.string().min(1, 'REDIS_PORT is required'),

  REDIS_PASSWORD: z.string().min(1, 'REDIS_PASSWORD is required'),

  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;
