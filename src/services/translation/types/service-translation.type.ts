import { z } from 'zod';

const subServiceSchema = z.object({
  icon: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export const serviceTranslationSchema = z.object({
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
  subServices: z.array(subServiceSchema).optional(),
});

export type ServiceTranslation = z.infer<typeof serviceTranslationSchema>;
