import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { StaffService } from '../services/staff.service';
import { StaffTranslationService } from '../services/staff-translation.service';
import { CreateStaffDto } from '../dtos/request/create-staff.dto';
import { LoginStaffDto } from '../dtos/request/login-staff.dto';
import { UpdateStaffBySuperAdminDto, UpdateStaffDto } from '../dtos/request/update-staff.dto';
import { CreateStaffTranslationDto } from '../dtos/request/create-staff-translation.dto';
import { UpdateStaffTranslationDto } from '../dtos/request/update-staff-translation.dto';
import { StaffResponseDto } from '../dtos/response/staff-response.dto';
import { StaffTranslationResponseDto } from '../dtos/response/staff-translation-response.dto';
import { LoginStaffResponseDto } from '../dtos/response/login-staff-response.dto';
import { StaffFilterDto } from '../dtos/query/staff-filter.dto';
import { AuthorFilterDto } from '../dtos/query/author-filter.dto';
import { PositiveIntPipe } from 'src/common/pipes/positive-int.pipe';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { SerializeResponse } from 'src/common/decorators/serialize-response.decorator';
import { Protected } from 'src/common/decorators/roles.decorator';
import { CurrentStaff } from 'src/common/decorators/staff.decorator';
import { Role } from 'src/common/enums/role.enum';
import { StaffEntity } from '../entities/staff.entity';
import { StaffRole } from '../enums/staff-role.enums';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';
import { TranslateResponse } from 'src/common/decorators/translate.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/common/utils/multer-config.factory';
import { FullStaffResponseDto } from '../dtos/response/full-staff-response.dto';

@Controller('staff')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly translations: StaffTranslationService,
  ) {}

  @Post('upload-picture')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @UseInterceptors(FileInterceptor('picture', createMulterConfig('image', 5, 1)))
  uploadPicture(@UploadedFile() picture: Express.Multer.File): Promise<{ url: string }> {
    if (!picture) {
      throw new BadRequestException('Picture is required');
    }

    return this.staffService.uploadPicture(picture);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SerializeResponse(LoginStaffResponseDto)
  async login(@Body() loginStaffDto: LoginStaffDto): Promise<LoginStaffResponseDto> {
    return this.staffService.login(loginStaffDto);
  }

  @Post()
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(FullStaffResponseDto)
  create(@Body() createStaffDto: CreateStaffDto): Promise<FullStaffResponseDto> {
    return this.staffService.create(createStaffDto);
  }

  @Patch('me')
  @Protected(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeResponse(FullStaffResponseDto)
  update(@CurrentStaff() staff: StaffEntity, @Body() updateStaffDto: UpdateStaffDto): Promise<FullStaffResponseDto> {
    return this.staffService.update(staff, updateStaffDto);
  }

  @Patch(':id')
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(FullStaffResponseDto)
  updateStaffBySuperAdmin(
    @Param('id', PositiveIntPipe) id: number,
    @Body() updateStaffDto: UpdateStaffBySuperAdminDto,
  ): Promise<FullStaffResponseDto> {
    return this.staffService.updateBySuperAdmin(id, updateStaffDto);
  }

  @Delete(':id')
  @Protected(Role.SUPER_ADMIN)
  async delete(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    await this.staffService.delete(id);
  }

  @Get('me')
  @Protected(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeResponse(FullStaffResponseDto)
  async getMe(@CurrentStaff() staff: StaffEntity): Promise<FullStaffResponseDto> {
    return staff;
  }

  // ===== AUTHOR ENDPOINTS =====
  @Get('authors')
  @TranslateResponse()
  findAuthors(@Query() filterAuthorDto: AuthorFilterDto): Promise<PaginationResponseDto<StaffResponseDto>> {
    return this.staffService.findAuthors(filterAuthorDto);
  }

  @Get('authors/:id')
  @TranslateResponse()
  @SerializeResponse(StaffResponseDto)
  findOneAuthor(
    @Param('id', PositiveIntPipe) id: number,
    @Query('lang') languageCode: string,
  ): Promise<StaffResponseDto> {
    return this.staffService.findOneAuthor(id, languageCode);
  }

  @Get(':id')
  @Protected(Role.SUPER_ADMIN)
  @SerializeResponse(StaffResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<StaffResponseDto> {
    return this.staffService.findOne(id);
  }

  @Get()
  @Protected(Role.SUPER_ADMIN)
  findAll(@Query() filterStaffDto: StaffFilterDto): Promise<PaginationResponseDto<StaffResponseDto>> {
    return this.staffService.findAll(filterStaffDto);
  }

  // ===== TRANSLATION ENDPOINTS =====
  @Post(':staffId/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(StaffTranslationResponseDto)
  createTranslation(
    @Param('staffId', PositiveIntPipe) staffId: number,
    @Body() dto: CreateStaffTranslationDto,
  ): Promise<StaffTranslationResponseDto> {
    return this.translations.create(staffId, dto);
  }

  @Post(':staffId/translations/auto')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(StaffTranslationResponseDto)
  createAutoTranslations(
    @Param('staffId', PositiveIntPipe) staffId: number,
    @Body() dto: AutoTranslateDto,
  ): Promise<StaffTranslationResponseDto[]> {
    return this.translations.autoTranslate(staffId, dto);
  }

  @Get(':staffId/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(StaffTranslationResponseDto)
  listTranslationsByStaff(@Param('staffId', PositiveIntPipe) staffId: number): Promise<StaffTranslationResponseDto[]> {
    return this.translations.listByStaff(staffId);
  }

  @Patch(':staffId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(StaffTranslationResponseDto)
  updateTranslation(
    @Param('translationId') translationId: number,
    @Param('staffId', PositiveIntPipe) staffId: number,
    @Body() dto: UpdateStaffTranslationDto,
  ): Promise<StaffTranslationResponseDto> {
    return this.translations.update(translationId, staffId, dto);
  }

  @Delete(':staffId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTranslation(
    @Param('translationId') translationId: number,
    @Param('staffId', PositiveIntPipe) staffId: number,
  ): Promise<void> {
    await this.translations.remove(translationId, staffId);
  }
}
