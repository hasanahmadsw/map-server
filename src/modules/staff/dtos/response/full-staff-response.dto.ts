import { Expose } from 'class-transformer';
import { StaffResponseDto } from './staff-response.dto';

export class FullStaffResponseDto extends StaffResponseDto {
  @Expose()
  role: string;
}
