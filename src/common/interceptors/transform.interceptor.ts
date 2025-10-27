// File: transform.interceptor.ts

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Response<T> {
  data: T | T[];
  pagination?: Pagination;
  meta: {
    message: string;
    statusCode: number;
    timestamp: string;
    status: 'success' | 'failure' | 'error';
    path: string;
    method: string;
    requestId?: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((res: any) => {
        const data = res?.data ?? res;
        const pagination = res?.pagination;

        return {
          data,
          ...(pagination && { pagination }),
          meta: {
            message: this.getSuccessMessage(request.method),
            statusCode: response.statusCode,
            timestamp: new Date().toISOString(),
            status: this.getResponseStatus(response.statusCode),
            path: request.url,
            method: request.method,
            requestId: this.generateRequestId(),
          },
        };
      }),
    );
  }

  private getSuccessMessage(method: string): string {
    const messages: Record<string, string> = {
      GET: 'Data retrieved successfully',
      POST: 'Resource created successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };
    return messages[method.toUpperCase()] || 'Operation completed successfully';
  }

  private getResponseStatus(statusCode: number): 'success' | 'failure' | 'error' {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'failure';
    return 'error';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
