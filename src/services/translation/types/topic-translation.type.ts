import z from 'zod';

export const topicTranslationSchema = z.object({
  name: z.string().nullable().optional().describe('The translated topic name'),
  description: z.string().nullable().optional().describe('The translated topic description, may contain HTML tags'),
});

export type TopicTranslation = z.infer<typeof topicTranslationSchema>;
