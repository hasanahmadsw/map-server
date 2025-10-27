import { ArgumentsHost, Catch, ExceptionFilter, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ErrorHandlerFactory } from './error-handler.factory';

/**
 * Global exception filter that handles all unhandled exceptions in the application
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorHandlerFactory: ErrorHandlerFactory) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate a unique trace ID for error tracking
    const traceId = randomUUID();

    try {
      // Get the appropriate handler for this type of error
      const handler = this.errorHandlerFactory.getHandler(exception);

      const errorResponse = handler.handle(exception, traceId);

      // Add stack trace in development
      if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = exception.stack;
      }

      // Send response
      const { statusCode, ...responseBody } = errorResponse;
      response.status(statusCode).json(responseBody);
    } catch (error) {
      response.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
        traceId,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
