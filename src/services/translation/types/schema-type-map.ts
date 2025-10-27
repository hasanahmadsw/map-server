import { z } from 'zod';

import { TranslationEventTypes } from '../enums/translated-types.enum';
import { articleTranslationSchema } from './article-translation.type';
import { settingTranslationSchema } from './settings-translation.type';
import { staffTranslationSchema } from './staff-translation.type';
import { serviceTranslationSchema } from './service-translation.type';
import { solutionTranslationSchema } from './solution-translation.type';
import { projectTranslationSchema } from './project-translation.type';

export const schemaMap: Record<TranslationEventTypes, z.ZodSchema> = {
  [TranslationEventTypes.article]: articleTranslationSchema,
  [TranslationEventTypes.setting]: settingTranslationSchema,
  [TranslationEventTypes.staff]: staffTranslationSchema,
  [TranslationEventTypes.service]: serviceTranslationSchema,
  [TranslationEventTypes.solution]: solutionTranslationSchema,
  [TranslationEventTypes.project]: projectTranslationSchema,
};
