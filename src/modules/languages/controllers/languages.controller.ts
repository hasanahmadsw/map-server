import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import { LanguagesService } from '../services/languages.service';
import { CreateLanguageDto } from '../dtos/request/create-language.dto';
import { UpdateLanguageDto } from '../dtos/request/update-language.dto';
import { LanguageResponseDto } from '../dtos/response/language-response.dto';
import { SerializeResponse } from 'src/common/decorators/serialize-response.decorator';
import { LanguageCodePipe } from 'src/common/pipes/language-code.pipe';
import { StaffRole } from 'src/modules/staff/enums/staff-role.enums';
import { Protected } from 'src/common/decorators/roles.decorator';
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  @Protected(StaffRole.SUPERADMIN)
  @SerializeResponse(LanguageResponseDto)
  create(@Body() createLanguageDto: CreateLanguageDto): Promise<LanguageResponseDto> {
    return this.languagesService.create(createLanguageDto);
  }

  @Get()
  @SerializeResponse(LanguageResponseDto)
  findAll(): Promise<LanguageResponseDto[]> {
    return this.languagesService.findAll();
  }

  @Get(':code')
  @SerializeResponse(LanguageResponseDto)
  findOneByCode(@Param('code', LanguageCodePipe) code: string): Promise<LanguageResponseDto> {
    return this.languagesService.findByCodeOrThrow(code);
  }

  @Patch(':code')
  @Protected(StaffRole.SUPERADMIN)
  @SerializeResponse(LanguageResponseDto)
  update(
    @Param('code', LanguageCodePipe) code: string,
    @Body() updateLanguageDto: UpdateLanguageDto,
  ): Promise<LanguageResponseDto> {
    return this.languagesService.update(code, updateLanguageDto);
  }

  @Delete(':code')
  @Protected(StaffRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('code', LanguageCodePipe) code: string): Promise<void> {
    await this.languagesService.delete(code);
  }
}
