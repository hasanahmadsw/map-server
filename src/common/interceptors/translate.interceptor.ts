import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const languageCode = request.headers['x-lang'] || 'en';

    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data)) {
          return data.map((item) => this.translateItem(item, languageCode));
        } else if (data && typeof data === 'object') {
          return this.translateItem(data, languageCode);
        }
        return data;
      }),
    );
  }

  private translateItem(item: any, languageCode: string): any {
    if (!item || typeof item !== 'object') return item;

    // Apply translation if available
    const translation = item.translations && item.translations.length > 0 ? item.translations[0] : null;

    if (translation) {
      for (const key of Object.keys(translation)) {
        if (!['id', 'languageId', 'languageCode'].includes(key)) {
          item[key] = translation[key];
        }
      }

      // Move translation metadata into outer object
      item.translationId = translation.id;
      item.translationLanguageId = translation.languageId;
      item.translationLanguageCode = translation.languageCode;
    }

    // Remove internal translations field
    delete item.translations;

    // Recursively translate nested arrays or objects
    for (const key of Object.keys(item)) {
      const value = item[key];

      if (Array.isArray(value)) {
        item[key] = value.map((subItem) => this.translateItem(subItem, languageCode));
      } else if (value && typeof value === 'object') {
        item[key] = this.translateItem(value, languageCode);
      }
    }

    return item;
  }
}
