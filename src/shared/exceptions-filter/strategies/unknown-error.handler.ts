import { HttpStatus } from '@nestjs/common';
import BaseErrorHandler from './error-handler.strategy';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Handles unknown/unexpected errors
 */
export class UnknownErrorHandler extends BaseErrorHandler {
  canHandle(error: Error): boolean {
    return true; // Fallback handler for any error
  }

  handle(error: Error, traceId: string): ErrorResponse {
    return {
      ...this.createBaseResponse(
        'error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred',
        traceId,
      ),
      context: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    };
  }
}
