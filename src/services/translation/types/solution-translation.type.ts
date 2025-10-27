import { z } from 'zod';

export const solutionTranslationSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  meta: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SolutionTranslation = z.infer<typeof solutionTranslationSchema>;
