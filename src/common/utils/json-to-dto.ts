import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export function convertJsonToDto<T extends object>(dtoClass: new () => T, json: unknown): T {
  const instance = plainToInstance(dtoClass, json);
  const errors: ValidationError[] = validateSync(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  });

  if (errors.length > 0) {
    const message = flattenValidationErrors(errors);
    throw new BadRequestException(`Validation failed: ${message}`);
  }

  return instance;
}

function flattenValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((err) => {
      if (err.constraints) {
        return Object.values(err.constraints).join(', ');
      }
      // Handle nested validation (e.g. arrays of objects)
      if (err.children && err.children.length > 0) {
        return flattenValidationErrors(err.children);
      }
      return '';
    })
    .filter(Boolean)
    .join(' , ');
}
