import { Expose, Type } from 'class-transformer';

class StaffInfoDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  role: string;
}

export class LoginStaffResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  @Type(() => StaffInfoDto)
  staff: StaffInfoDto;
}
