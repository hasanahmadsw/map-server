import { IsOptional, IsString } from 'class-validator';
import { IsLanguageCode } from 'src/common';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class AuthorFilterDto extends PaginationDto {
  @IsLanguageCode()
  languageCode: string;
}
