import { HttpException } from '@nestjs/common';
import BaseErrorHandler from './error-handler.strategy';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Handles NestJS HttpExceptions
 */
export class HttpExceptionHandler extends BaseErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof HttpException;
  }

  handle(error: HttpException, traceId: string): ErrorResponse {
    const status = error.getStatus();
    const response = error.getResponse() as any;

    return {
      ...this.createBaseResponse(
        status >= 500 ? 'error' : 'failure',
        status,
        response.message || error.message,
        traceId,
      ),
      context: {
        code: response.code,
        details: response.data,
      },
    };
  }
}
