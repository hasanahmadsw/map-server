/**
 * Represents the standardized error response structure
 */
export interface ErrorResponse {
  /** Indicates if this is a client error ('failure') or server error ('error') */
  status: 'error' | 'failure';

  /** HTTP status code for the error */
  statusCode: number;

  /** Human-readable error message or messages */
  message: string | string[];

  /** Unique identifier for error tracking */
  traceId: string;

  /** Timestamp when the error occurred */
  timestamp: string;

  /** Optional additional error context */
  context?: {
    /** Request-specific metadata */
    request?: Record<string, any>;

    /** Additional error details */
    details?: Record<string, any>;

    /** Error code for client-side error handling */
    code?: string;
  };

  /** Stack trace (only included in development) */
  stack?: string;
}

/**
 * Configuration options for error response generation
 */
export interface ErrorResponseOptions {
  includeStack?: boolean;
  includeRequest?: boolean;
  includeContext?: boolean;
}
