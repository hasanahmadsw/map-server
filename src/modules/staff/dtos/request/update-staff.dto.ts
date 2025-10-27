import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateStaffDto } from './create-staff.dto';

export class UpdateStaffDto extends OmitType(PartialType(CreateStaffDto), ['email', 'role']) {}

export class UpdateStaffBySuperAdminDto extends OmitType(PartialType(CreateStaffDto), ['email']) {}
