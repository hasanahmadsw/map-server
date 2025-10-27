import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { StaffRole } from '../../enums/staff-role.enums';
import { IsLanguageCode, IsLanguageCodeArray } from 'src/common';

export class CreateStaffDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)',
  })
  password: string;

  @IsEnum(StaffRole, { message: 'Role must be a valid StaffRole (superadmin, admin, author)' })
  role: StaffRole;

  @IsString({ message: 'Bio must be a string' })
  @IsOptional({ message: 'Bio is optional' })
  bio: string;

  @IsLanguageCode()
  languageCode: string;

  @IsString({ message: 'Image must be a string' })
  @IsOptional({ message: 'Image is optional' })
  image: string;

  @IsLanguageCodeArray()
  translateTo: string[];
}
