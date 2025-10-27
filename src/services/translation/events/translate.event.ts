import { TranslationEventTypes } from '../enums/translated-types.enum';
import { SchemaType } from '../types/schema.type';

export type TranslateEvent = {
  id: number;
  translatedType: TranslationEventTypes;
  translationFields: SchemaType;
  languageCode: string;
  languageName: string;
};
