import z from 'zod';

export const settingTranslationSchema = z.object({
  siteName: z.string().nullable().optional().describe('Translated site name'),
  siteDescription: z.string().nullable().optional().describe('Translated site description'),
  meta: z
    .object({
      title: z.string().describe('Translated meta title'),
      description: z.string().describe('Translated meta description'),
      keywords: z.array(z.string()).describe('Translated meta keywords'),
    })
    .nullable()
    .optional(),
  siteLogo: z.string().nullable().optional().describe('Logo URL (should NOT be translated)'),
  siteDarkLogo: z.string().nullable().optional().describe('Dark logo URL (should NOT be translated)'),
});

export type SettingsTranslation = z.infer<typeof settingTranslationSchema>;
