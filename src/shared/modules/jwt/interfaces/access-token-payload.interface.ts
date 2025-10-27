import { Exclude, Expose } from 'class-transformer';
import { BaseJwtPayload } from './base-jwt-payload.interface';
import { StaffRole } from 'src/modules/staff/enums/staff-role.enums';

@Exclude()
export class AccessTokenPayload {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  role: StaffRole;
}

export interface DecodedAccessTokenPayload extends AccessTokenPayload, BaseJwtPayload {}
