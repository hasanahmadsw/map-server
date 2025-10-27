import { Injectable } from '@nestjs/common';
import { ErrorHandlerStrategy } from './strategies/error-handler.strategy';
import { HttpExceptionHandler } from './strategies/http-exception.handler';
import { JwtErrorHandler } from './strategies/jwt-error.handler';
import { MulterErrorHandler } from './strategies/multer-error.handler';
import { UnknownErrorHandler } from './strategies/unknown-error.handler';

/**
 * Factory for creating appropriate error handlers based on error type
 */
@Injectable()
export class ErrorHandlerFactory {
  private readonly handlers: ErrorHandlerStrategy[];
  private readonly fallbackHandler: ErrorHandlerStrategy;

  constructor() {
    this.handlers = [new MulterErrorHandler(), new JwtErrorHandler(), new HttpExceptionHandler()];
    this.fallbackHandler = new UnknownErrorHandler();
  }

  /**
   * Gets the appropriate handler for the given error
   */
  getHandler(error: Error): ErrorHandlerStrategy {
    console.log('error', error);
    return this.handlers.find((handler) => handler.canHandle(error)) || this.fallbackHandler;
  }
}
