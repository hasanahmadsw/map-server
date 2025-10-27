import { CallHandler, NestInterceptor, UseInterceptors } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassConstructor, plainToInstance } from 'class-transformer';

class SerializeInterceptor<T> implements NestInterceptor {
  constructor(private responseDto: ClassConstructor<T>) {}

  intercept(_: never, handler: CallHandler): Observable<T> {
    return handler.handle().pipe(
      map((data: any) => {
        return plainToInstance(this.responseDto, data, {
          excludeExtraneousValues: false, // Changed to false to allow nested objects
          enableImplicitConversion: true,
          exposeDefaultValues: true,
        });
      }),
    );
  }
}

export function SerializeResponse<T>(responseDto: ClassConstructor<T>) {
  return UseInterceptors(new SerializeInterceptor(responseDto));
}
