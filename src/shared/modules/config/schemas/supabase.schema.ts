import { z } from 'zod';

export const supabaseSchema = z.object({
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY is required'),
  PICTURES_BUCKET_NAME: z.string().min(1, 'PICTURES_BUCKET_NAME is required'),
});

export type SupabaseConfig = z.infer<typeof supabaseSchema>;
