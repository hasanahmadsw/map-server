import { z } from 'zod';
import { databaseSchema, serverSchema, jwtSchema, openaiSchema, supabaseSchema } from './schemas';

export const environmentSchema = z.object({
  ...serverSchema.shape,
  ...databaseSchema.shape,
  ...jwtSchema.shape,
  ...openaiSchema.shape,
  ...supabaseSchema.shape,
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;
