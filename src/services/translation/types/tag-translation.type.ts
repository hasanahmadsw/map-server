import z from 'zod';

export const tagTranslationSchema = z.object({
  name: z.string().nullable().optional().describe('The translated tag name'),
  description: z.string().nullable().optional().describe('The translated tag description'),
});

export type TagTranslation = z.infer<typeof tagTranslationSchema>;
