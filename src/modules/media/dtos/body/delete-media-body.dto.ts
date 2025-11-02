import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class DeleteMediaBodyDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one file path must be provided' })
  @IsString({ each: true })
  paths: string[];
}
