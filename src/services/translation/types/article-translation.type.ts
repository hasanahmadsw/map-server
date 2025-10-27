import { z } from 'zod';

export const articleTranslationSchema = z.object({
  name: z.string().nullable().optional().describe('The translated article name/title'),
  content: z.string().nullable().optional().describe('The translated article body, may contain HTML tags'),
  excerpt: z.string().nullable().optional().describe('The translated article summary'),
  meta: z
    .object({
      title: z.string().nullable().optional().describe('Translated SEO title'),
      description: z.string().nullable().optional().describe('Translated SEO description'),
      keywords: z.array(z.string()).nullable().optional().describe('Translated SEO keywords'),
    })
    .nullable()
    .optional(),
});

export type ArticleTranslation = z.infer<typeof articleTranslationSchema>;
