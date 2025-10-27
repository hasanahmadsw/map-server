import z from 'zod';

export const staffTranslationSchema = z.object({
  name: z.string().nullable().optional().describe('The translated staff name'),
  bio: z.string().nullable().optional().describe('The translated staff bio, may contain HTML tags'),
});

export type StaffTranslation = z.infer<typeof staffTranslationSchema>;
