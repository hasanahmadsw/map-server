import { ArticleTranslationEntity } from 'src/modules/articles/entities/article-translation.entity';
import { TranslationEventTypes } from '../enums/translated-types.enum';
import { SettingTranslationEntity } from 'src/modules/settings/entities/setting-translation.entity';
import { StaffTranslationEntity } from 'src/modules/staff/entities/staff-translation.entity';
import { ServiceTranslationEntity } from 'src/modules/services/entities/service-translation.entity';
import { SolutionTranslationEntity } from 'src/modules/solutions/entities/solution-translation.entity';
import { ProjectTranslationEntity } from 'src/modules/projects/entities/project-translation.entity';

export const EntityTypeMap: Record<TranslationEventTypes, any> = {
  [TranslationEventTypes.article]: ArticleTranslationEntity,
  [TranslationEventTypes.setting]: SettingTranslationEntity,
  [TranslationEventTypes.staff]: StaffTranslationEntity,
  [TranslationEventTypes.service]: ServiceTranslationEntity,
  [TranslationEventTypes.solution]: SolutionTranslationEntity,
  [TranslationEventTypes.project]: ProjectTranslationEntity,
};
