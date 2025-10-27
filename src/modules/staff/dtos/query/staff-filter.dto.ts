import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { StrictBoolean } from 'src/common/decorators/strict-boolean.decorator';

export class StaffFilterDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(1, 50, { message: 'Name must be between 1 and 50 characters' })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsOptional()
  @StrictBoolean()
  isDeleted?: boolean;
}
