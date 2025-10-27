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
import { SolutionsService } from '../services/solutions.service';
import { SolutionTranslationsService } from '../services/solution-translations.service';
import { CreateSolutionDto } from '../dtos/request/create-solution.dto';
import { UpdateSolutionDto } from '../dtos/request/update-solution.dto';
import { CreateSolutionTranslationDto } from '../dtos/request/create-solution-translation.dto';
import { UpdateSolutionTranslationDto } from '../dtos/request/update-solution-translation.dto';
import { SolutionResponseDto } from '../dtos/response/solution-response.dto';
import { SolutionTranslationResponseDto } from '../dtos/response/solution-translation-response.dto';
import { SolutionFilterDto } from '../dtos/query/solution-filter.dto';
import { PositiveIntPipe } from 'src/common/pipes/positive-int.pipe';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { SerializeResponse } from 'src/common/decorators/serialize-response.decorator';
import { Protected } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { LanguageCodePipe } from 'src/common/pipes/language-code.pipe';
import { PublicSolutionFilterDto } from '../dtos/query/public-solution-filter.dto';
import { TranslateResponse } from 'src/common/decorators/translate.decorator';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/common/utils/multer-config.factory';

@Controller('solutions')
export class SolutionsController {
  constructor(
    private readonly solutionsService: SolutionsService,
    private readonly translations: SolutionTranslationsService,
  ) {}

  @Post('upload-picture')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @UseInterceptors(FileInterceptor('picture', createMulterConfig('image', 5, 1)))
  uploadPicture(@UploadedFile() picture: Express.Multer.File): Promise<{ url: string }> {
    if (!picture) {
      throw new BadRequestException('Picture is required');
    }

    return this.solutionsService.uploadPicture(picture);
  }

  @Post()
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionResponseDto)
  create(@Body() createSolutionDto: CreateSolutionDto): Promise<SolutionResponseDto> {
    return this.solutionsService.create(createSolutionDto);
  }

  @Get('staff')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  findAllForStaff(@Query() filterSolutionDto: SolutionFilterDto): Promise<PaginationResponseDto<SolutionResponseDto>> {
    return this.solutionsService.findAll(filterSolutionDto);
  }

  @Get('staff/:id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<SolutionResponseDto> {
    return this.solutionsService.getById(id);
  }

  @Patch(':id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionResponseDto)
  update(
    @Param('id', PositiveIntPipe) id: number,
    @Body() updateSolutionDto: UpdateSolutionDto,
  ): Promise<SolutionResponseDto> {
    return this.solutionsService.update(id, updateSolutionDto);
  }

  @Delete(':id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    this.solutionsService.delete(id);
  }

  @Patch(':id/publish')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionResponseDto)
  publish(@Param('id', PositiveIntPipe) id: number): Promise<SolutionResponseDto> {
    return this.solutionsService.publish(id);
  }

  @Patch(':id/unpublish')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionResponseDto)
  unpublish(@Param('id', PositiveIntPipe) id: number): Promise<SolutionResponseDto> {
    return this.solutionsService.unpublish(id);
  }

  @Patch(':id/toggle-featured')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionResponseDto)
  toggleFeatured(@Param('id', PositiveIntPipe) id: number): Promise<SolutionResponseDto> {
    return this.solutionsService.toggleFeatured(id);
  }

  // ===== PUBLIC ENDPOINTS =====
  @Get('published')
  @TranslateResponse()
  getPublishedSolutions(
    @Query() filterSolutionDto: PublicSolutionFilterDto,
  ): Promise<PaginationResponseDto<SolutionResponseDto>> {
    return this.solutionsService.getPublishedSolutions(filterSolutionDto);
  }

  @Get('featured')
  @TranslateResponse()
  getFeaturedSolutions(
    @Query() filterSolutionDto: PublicSolutionFilterDto,
  ): Promise<PaginationResponseDto<SolutionResponseDto>> {
    return this.solutionsService.getFeaturedSolutions(filterSolutionDto);
  }

  @Get('slug/:slug')
  @SerializeResponse(SolutionResponseDto)
  @TranslateResponse()
  getBySlugPublic(
    @Param('slug') slug: string,
    @Query('lang', LanguageCodePipe) languageCode: string,
  ): Promise<SolutionResponseDto> {
    return this.solutionsService.getBySlugPublic(slug, languageCode);
  }

  // ===== TRANSLATION ENDPOINTS =====
  @Post(':id/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionTranslationResponseDto)
  createTranslation(
    @Param('id', PositiveIntPipe) solutionId: number,
    @Body() dto: CreateSolutionTranslationDto,
  ): Promise<SolutionTranslationResponseDto> {
    return this.translations.create(solutionId, dto);
  }

  @Post(':id/translations/auto')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionTranslationResponseDto)
  createAutoTranslations(
    @Param('id', PositiveIntPipe) solutionId: number,
    @Body() dto: AutoTranslateDto,
  ): Promise<SolutionTranslationResponseDto[]> {
    return this.translations.autoTranslate(solutionId, dto);
  }

  @Get(':id/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionTranslationResponseDto)
  listTranslationsBySolution(
    @Param('id', PositiveIntPipe) solutionId: number,
  ): Promise<SolutionTranslationResponseDto[]> {
    return this.translations.listBySolution(solutionId);
  }

  @Patch(':solutionId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(SolutionTranslationResponseDto)
  updateTranslation(
    @Param('translationId', PositiveIntPipe) translationId: number,
    @Param('solutionId', PositiveIntPipe) solutionId: number,
    @Body() dto: UpdateSolutionTranslationDto,
  ): Promise<SolutionTranslationResponseDto> {
    return this.translations.update(translationId, solutionId, dto);
  }

  @Delete(':solutionId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTranslation(
    @Param('translationId', PositiveIntPipe) translationId: number,
    @Param('solutionId', PositiveIntPipe) solutionId: number,
  ): Promise<void> {
    await this.translations.remove(translationId, solutionId);
  }
}
