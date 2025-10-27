import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { StaffResponseDto } from 'src/modules/staff/dtos/response/staff-response.dto';

export const CurrentStaff = createParamDecorator(
  (data: string, ctx: ExecutionContext): StaffResponseDto | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const staff = request.staff;
    return staff;
  },
);
