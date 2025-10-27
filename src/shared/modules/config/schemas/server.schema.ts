import { z } from 'zod';
import { booleanTransformer } from '../transformers/boolean.transformer';

export const serverSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().int()),

  NODE_ENV: z.enum(['development', 'production', 'test']),

  APP_NAME: z
    .string()
    .min(3, 'APP_NAME must be at least 3 characters long')
    .max(50, 'APP_NAME cannot exceed 50 characters'),
});

export type ServerConfig = z.infer<typeof serverSchema>;
