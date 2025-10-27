import { Role } from 'src/common/enums/role.enum';
import { BaseJwtPayload } from './base-jwt-payload.interface';

export interface SecurityTokenPayload {
  email: string;
  code: string;
  roles?: Role;
  type: 'email_verification' | 'password_reset';
}

export interface DecodedSecurityTokenPayload extends SecurityTokenPayload, BaseJwtPayload {}
