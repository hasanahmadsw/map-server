// ============ roles.decorator.ts ============
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => {
  return SetMetadata(ROLES_KEY, roles);
};

export const Protected = (...roles: string[]) => {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(AuthGuard));
};
