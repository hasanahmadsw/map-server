import { HttpStatus } from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import BaseErrorHandler from './error-handler.strategy';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Handles JWT-related errors
 */
export class JwtErrorHandler extends BaseErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof JsonWebTokenError || error instanceof TokenExpiredError;
  }

  handle(error: Error, traceId: string): ErrorResponse {
    const isExpired = error instanceof TokenExpiredError;

    return {
      ...this.createBaseResponse(
        'failure',
        HttpStatus.UNAUTHORIZED,
        error.message ?? (isExpired ? 'Token has expired' : 'Invalid token signature'),
        traceId,
      ),
      context: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      },
    };
  }
}
