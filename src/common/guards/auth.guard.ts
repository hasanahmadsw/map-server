import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { AppJwtService } from 'src/shared/modules/jwt/jwt.service';
import { StaffService } from 'src/modules/staff/services/staff.service';
import { StaffRole } from 'src/modules/staff/enums/staff-role.enums';
import { DecodedAccessTokenPayload } from 'src/shared/modules/jwt/interfaces/access-token-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: AppJwtService,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token not found.');
    }

    const payload: DecodedAccessTokenPayload = this.jwtService.verifyAccessToken(token);
    request.role = payload.role;

    if (roles.length !== 0 && !roles.includes(payload.role)) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    request.staff = await this.validateStaff(payload);
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async validateStaff(payload: DecodedAccessTokenPayload) {
    const staffService = this.moduleRef.get(StaffService, {
      strict: false,
    });
    const staff = await staffService.findOne(payload.id);

    // Check if token was issued before password was changed
    const passwordChangedAt = staff.passwordChangedAt
      ? Math.floor(new Date(staff.passwordChangedAt).getTime() / 1000)
      : 0;
    if (payload.iat && passwordChangedAt && payload.iat < passwordChangedAt) {
      throw new UnauthorizedException('Token was issued before the last password change.');
    }

    if (staff.role !== StaffRole.ADMIN && staff.role !== StaffRole.SUPERADMIN && staff.role !== StaffRole.AUTHOR) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }
    return staff;
  }
}
