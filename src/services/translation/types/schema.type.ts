import { ArticleTranslation } from './article-translation.type';
import { SettingsTranslation } from './settings-translation.type';
import { StaffTranslation } from './staff-translation.type';
import { ServiceTranslation } from './service-translation.type';
import { SolutionTranslation } from './solution-translation.type';
import { ProjectTranslation } from './project-translation.type';

export type SchemaType =
  | ArticleTranslation
  | SettingsTranslation
  | StaffTranslation
  | ServiceTranslation
  | SolutionTranslation
  | ProjectTranslation;
