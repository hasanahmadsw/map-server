import { TranslationEventTypes } from '../enums/translated-types.enum';

export const PrimaryColumnMap: Record<TranslationEventTypes, string> = {
  [TranslationEventTypes.article]: 'articleId',
  [TranslationEventTypes.setting]: 'settingId',
  [TranslationEventTypes.staff]: 'staffId',
  [TranslationEventTypes.service]: 'serviceId',
  [TranslationEventTypes.solution]: 'solutionId',
  [TranslationEventTypes.project]: 'projectId',
};
