import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { TranslationInterceptor } from '../interceptors/translate.interceptor';

/**
 * Decorator to apply translation interceptor to a route.
 * Usage: @TranslateResponse()
 */
export function TranslateResponse() {
  return applyDecorators(UseInterceptors(TranslationInterceptor));
}
