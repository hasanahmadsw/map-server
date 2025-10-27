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
import { ProjectsService } from '../services/projects.service';
import { ProjectTranslationsService } from '../services/project-translations.service';
import { CreateProjectDto } from '../dtos/request/create-project.dto';
import { UpdateProjectDto } from '../dtos/request/update-project.dto';
import { CreateProjectTranslationDto } from '../dtos/request/create-project-translation.dto';
import { UpdateProjectTranslationDto } from '../dtos/request/update-project-translation.dto';
import { ProjectResponseDto } from '../dtos/response/project-response.dto';
import { ProjectTranslationResponseDto } from '../dtos/response/project-translation-response.dto';
import { ProjectFilterDto } from '../dtos/query/project-filter.dto';
import { PositiveIntPipe } from 'src/common/pipes/positive-int.pipe';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { SerializeResponse } from 'src/common/decorators/serialize-response.decorator';
import { Protected } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { LanguageCodePipe } from 'src/common/pipes/language-code.pipe';
import { PublicProjectFilterDto } from '../dtos/query/public-project-filter.dto';
import { TranslateResponse } from 'src/common/decorators/translate.decorator';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/common/utils/multer-config.factory';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly translations: ProjectTranslationsService,
  ) {}

  @Post('upload-picture')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @UseInterceptors(FileInterceptor('picture', createMulterConfig('image', 5, 1)))
  uploadPicture(@UploadedFile() picture: Express.Multer.File): Promise<{ url: string }> {
    if (!picture) {
      throw new BadRequestException('Picture is required');
    }

    return this.projectsService.uploadPicture(picture);
  }

  @Post()
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectResponseDto)
  create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto);
  }

  @Get('staff')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  findAllForStaff(@Query() filterProjectDto: ProjectFilterDto): Promise<PaginationResponseDto<ProjectResponseDto>> {
    return this.projectsService.findAll(filterProjectDto);
  }

  @Get('staff/:id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<ProjectResponseDto> {
    return this.projectsService.getById(id);
  }

  @Patch(':id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectResponseDto)
  update(
    @Param('id', PositiveIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    this.projectsService.delete(id);
  }

  @Patch(':id/publish')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectResponseDto)
  publish(@Param('id', PositiveIntPipe) id: number): Promise<ProjectResponseDto> {
    return this.projectsService.publish(id);
  }

  @Patch(':id/unpublish')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectResponseDto)
  unpublish(@Param('id', PositiveIntPipe) id: number): Promise<ProjectResponseDto> {
    return this.projectsService.unpublish(id);
  }

  @Patch(':id/toggle-featured')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectResponseDto)
  toggleFeatured(@Param('id', PositiveIntPipe) id: number): Promise<ProjectResponseDto> {
    return this.projectsService.toggleFeatured(id);
  }

  // ===== PUBLIC ENDPOINTS =====
  @Get('published')
  @TranslateResponse()
  getPublishedProjects(
    @Query() filterProjectDto: PublicProjectFilterDto,
  ): Promise<PaginationResponseDto<ProjectResponseDto>> {
    return this.projectsService.getPublishedProjects(filterProjectDto);
  }

  @Get('featured')
  @TranslateResponse()
  getFeaturedProjects(
    @Query() filterProjectDto: PublicProjectFilterDto,
  ): Promise<PaginationResponseDto<ProjectResponseDto>> {
    return this.projectsService.getFeaturedProjects(filterProjectDto);
  }

  @Get('slug/:slug')
  @SerializeResponse(ProjectResponseDto)
  @TranslateResponse()
  getBySlugPublic(
    @Param('slug') slug: string,
    @Query('lang', LanguageCodePipe) languageCode: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.getBySlugPublic(slug, languageCode);
  }

  // ===== TRANSLATION ENDPOINTS =====
  @Post(':id/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectTranslationResponseDto)
  createTranslation(
    @Param('id', PositiveIntPipe) projectId: number,
    @Body() dto: CreateProjectTranslationDto,
  ): Promise<ProjectTranslationResponseDto> {
    return this.translations.create(projectId, dto);
  }

  @Post(':id/translations/auto')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectTranslationResponseDto)
  createAutoTranslations(
    @Param('id', PositiveIntPipe) projectId: number,
    @Body() dto: AutoTranslateDto,
  ): Promise<ProjectTranslationResponseDto[]> {
    return this.translations.autoTranslate(projectId, dto);
  }

  @Get(':id/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectTranslationResponseDto)
  listTranslationsByProject(@Param('id', PositiveIntPipe) projectId: number): Promise<ProjectTranslationResponseDto[]> {
    return this.translations.listByProject(projectId);
  }

  @Patch(':projectId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ProjectTranslationResponseDto)
  updateTranslation(
    @Param('translationId', PositiveIntPipe) translationId: number,
    @Param('projectId', PositiveIntPipe) projectId: number,
    @Body() dto: UpdateProjectTranslationDto,
  ): Promise<ProjectTranslationResponseDto> {
    return this.translations.update(translationId, projectId, dto);
  }

  @Delete(':projectId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTranslation(
    @Param('translationId', PositiveIntPipe) translationId: number,
    @Param('projectId', PositiveIntPipe) projectId: number,
  ): Promise<void> {
    await this.translations.remove(translationId, projectId);
  }
}
