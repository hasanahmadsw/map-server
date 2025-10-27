import { z } from 'zod';

export const openaiSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
});

export type OpenaiConfig = z.infer<typeof openaiSchema>;
