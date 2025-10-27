import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { ServiceTranslationsService } from '../services/service-translations.service';
import { CreateServiceDto } from '../dtos/request/create-service.dto';
import { UpdateServiceDto } from '../dtos/request/update-service.dto';
import { CreateServiceTranslationDto } from '../dtos/request/create-service-translation.dto';
import { UpdateServiceTranslationDto } from '../dtos/request/update-service-translation.dto';
import { ServiceResponseDto } from '../dtos/response/service-response.dto';
import { ServiceTranslationResponseDto } from '../dtos/response/service-translation-response.dto';
import { ServiceFilterDto } from '../dtos/query/service-filter.dto';
import { PositiveIntPipe } from 'src/common/pipes/positive-int.pipe';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { SerializeResponse } from 'src/common/decorators/serialize-response.decorator';
import { Protected } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { LanguageCodePipe } from 'src/common/pipes/language-code.pipe';
import { PublicServiceFilterDto } from '../dtos/query/public-service-filter.dto';
import { TranslateResponse } from 'src/common/decorators/translate.decorator';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/common/utils/multer-config.factory';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly translations: ServiceTranslationsService,
  ) {}

  @Post('upload-picture')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @UseInterceptors(FileInterceptor('picture', createMulterConfig('image', 5, 1)))
  uploadPicture(@UploadedFile() picture: Express.Multer.File): Promise<{ url: string }> {
    if (!picture) {
      throw new BadRequestException('Picture is required');
    }

    return this.servicesService.uploadPicture(picture);
  }

  @Post()
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceResponseDto)
  create(@Body() createServiceDto: CreateServiceDto): Promise<ServiceResponseDto> {
    return this.servicesService.create(createServiceDto);
  }

  @Get('staff')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  findAllForStaff(@Query() filterServiceDto: ServiceFilterDto): Promise<PaginationResponseDto<ServiceResponseDto>> {
    return this.servicesService.findAll(filterServiceDto);
  }

  @Get('staff/:id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<ServiceResponseDto> {
    return this.servicesService.getById(id);
  }

  @Patch(':id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceResponseDto)
  update(
    @Param('id', PositiveIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    this.servicesService.delete(id);
  }

  @Patch(':id/publish')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceResponseDto)
  publish(@Param('id', PositiveIntPipe) id: number): Promise<ServiceResponseDto> {
    return this.servicesService.publish(id);
  }

  @Patch(':id/unpublish')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceResponseDto)
  unpublish(@Param('id', PositiveIntPipe) id: number): Promise<ServiceResponseDto> {
    return this.servicesService.unpublish(id);
  }

  @Patch(':id/toggle-featured')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceResponseDto)
  toggleFeatured(@Param('id', PositiveIntPipe) id: number): Promise<ServiceResponseDto> {
    return this.servicesService.toggleFeatured(id);
  }

  // ===== PUBLIC ENDPOINTS =====
  @Get('published')
  @TranslateResponse()
  getPublishedServices(
    @Query() filterServiceDto: PublicServiceFilterDto,
  ): Promise<PaginationResponseDto<ServiceResponseDto>> {
    return this.servicesService.getPublishedServices(filterServiceDto);
  }

  @Get('featured')
  @TranslateResponse()
  getFeaturedServices(
    @Query() filterServiceDto: PublicServiceFilterDto,
  ): Promise<PaginationResponseDto<ServiceResponseDto>> {
    return this.servicesService.getFeaturedServices(filterServiceDto);
  }

  @Get('slug/:slug')
  @SerializeResponse(ServiceResponseDto)
  @TranslateResponse()
  getBySlugPublic(
    @Param('slug') slug: string,
    @Query('lang', LanguageCodePipe) languageCode: string,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.getBySlugPublic(slug, languageCode);
  }

  // ===== TRANSLATION ENDPOINTS =====
  @Post(':id/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceTranslationResponseDto)
  createTranslation(
    @Param('id', PositiveIntPipe) serviceId: number,
    @Body() dto: CreateServiceTranslationDto,
  ): Promise<ServiceTranslationResponseDto> {
    return this.translations.create(serviceId, dto);
  }

  @Post(':id/translations/auto')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceTranslationResponseDto)
  createAutoTranslations(
    @Param('id', PositiveIntPipe) serviceId: number,
    @Body() dto: AutoTranslateDto,
  ): Promise<ServiceTranslationResponseDto[]> {
    return this.translations.autoTranslate(serviceId, dto);
  }

  @Get(':id/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceTranslationResponseDto)
  listTranslationsByService(@Param('id', PositiveIntPipe) serviceId: number): Promise<ServiceTranslationResponseDto[]> {
    return this.translations.listByService(serviceId);
  }

  @Patch(':serviceId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ServiceTranslationResponseDto)
  updateTranslation(
    @Param('translationId', PositiveIntPipe) translationId: number,
    @Param('serviceId', PositiveIntPipe) serviceId: number,
    @Body() dto: UpdateServiceTranslationDto,
  ): Promise<ServiceTranslationResponseDto> {
    return this.translations.update(translationId, serviceId, dto);
  }

  @Delete(':serviceId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTranslation(
    @Param('translationId', PositiveIntPipe) translationId: number,
    @Param('serviceId', PositiveIntPipe) serviceId: number,
  ): Promise<void> {
    await this.translations.remove(translationId, serviceId);
  }
}
