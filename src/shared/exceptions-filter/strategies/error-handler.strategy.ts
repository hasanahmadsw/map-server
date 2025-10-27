import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Base interface for error handling strategies
 */
export interface ErrorHandlerStrategy {
  /**
   * Checks if this strategy can handle the given error
   */
  canHandle(error: Error): boolean;

  /**
   * Processes the error and returns a standardized error response
   */
  handle(error: Error, traceId: string): ErrorResponse;
}

/**
 * Abstract base class for error handling strategies
 */
export default abstract class BaseErrorHandler implements ErrorHandlerStrategy {
  abstract canHandle(error: Error): boolean;

  abstract handle(error: Error, traceId: string): ErrorResponse;

  /**
   * Creates a base error response structure
   */
  protected createBaseResponse(
    status: 'error' | 'failure',
    statusCode: number,
    message: string | string[],
    traceId: string,
  ): ErrorResponse {
    return {
      status,
      statusCode,
      message,
      traceId,
      timestamp: new Date().toISOString(),
    };
  }
}

export { BaseErrorHandler };
