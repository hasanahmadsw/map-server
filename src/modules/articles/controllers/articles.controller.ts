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
import { ArticlesService } from '../services/articles.service';
import { ArticleTranslationsService } from '../services/article-translations.service';
import { CreateArticleDto } from '../dtos/request/create-article.dto';
import { UpdateArticleDto } from '../dtos/request/update-article.dto';
import { CreateArticleTranslationDto } from '../dtos/request/create-article-translation.dto';
import { UpdateArticleTranslationDto } from '../dtos/request/update-article-translation.dto';
import { ArticleResponseDto } from '../dtos/response/article-response.dto';
import { ArticleTranslationResponseDto } from '../dtos/response/article-translation-response.dto';
import { ArticleFilterDto } from '../dtos/query/article-filter.dto';
import { PositiveIntPipe } from 'src/common/pipes/positive-int.pipe';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { SerializeResponse } from 'src/common/decorators/serialize-response.decorator';
import { Protected } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { filter } from 'rxjs';
import { LanguageCodePipe } from 'src/common/pipes/language-code.pipe';
import { PublicArticleFilterDto } from '../dtos/query/public-article-filter.dto';
import { TranslateResponse } from 'src/common/decorators/translate.decorator';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';
import { CurrentStaff } from 'src/common/decorators/staff.decorator';
import { StaffEntity } from 'src/modules/staff/entities/staff.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/common/utils/multer-config.factory';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly translations: ArticleTranslationsService,
  ) {}

  @Post('upload-picture')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @UseInterceptors(FileInterceptor('picture', createMulterConfig('image', 5, 1)))
  uploadPicture(@UploadedFile() picture: Express.Multer.File): Promise<{ url: string }> {
    if (!picture) {
      throw new BadRequestException('Picture is required');
    }

    return this.articlesService.uploadPicture(picture);
  }

  @Post()
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ArticleResponseDto)
  create(@CurrentStaff() author: StaffEntity, @Body() createArticleDto: CreateArticleDto): Promise<ArticleResponseDto> {
    return this.articlesService.create(author, createArticleDto);
  }

  @Get('staff')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  findAllForStaff(@Query() filterArticleDto: ArticleFilterDto): Promise<PaginationResponseDto<ArticleResponseDto>> {
    return this.articlesService.findAll(filterArticleDto);
  }

  @Get('staff/:id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ArticleResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<ArticleResponseDto> {
    return this.articlesService.getById(id);
  }

  @Patch(':id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ArticleResponseDto)
  update(
    @Param('id', PositiveIntPipe) id: number,
    @CurrentStaff() author: StaffEntity,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.update(id, author, updateArticleDto);
  }

  @Delete(':id')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', PositiveIntPipe) id: number, @CurrentStaff() author: StaffEntity): Promise<void> {
    this.articlesService.delete(id, author);
  }

  // ===== PUBLIC ENDPOINTS =====
  @Get('published')
  @TranslateResponse()
  getPublishedArticles(
    @Query() filterArticleDto: PublicArticleFilterDto,
  ): Promise<PaginationResponseDto<ArticleResponseDto>> {
    return this.articlesService.getPublishedArticles(filterArticleDto);
  }

  @Get('featured')
  @TranslateResponse()
  getFeaturedArticles(
    @Query() filterArticleDto: PublicArticleFilterDto,
  ): Promise<PaginationResponseDto<ArticleResponseDto>> {
    return this.articlesService.getFeaturedArticles(filterArticleDto);
  }

  @Get('slug/:slug')
  @SerializeResponse(ArticleResponseDto)
  @TranslateResponse()
  getBySlugPublic(
    @Param('slug') slug: string,
    @Query('lang', LanguageCodePipe) languageCode: string,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.getBySlugPublic(slug, languageCode);
  }

  @Get('slug/:slug/related')
  @SerializeResponse(ArticleResponseDto)
  @TranslateResponse()
  findRelatedArticles(
    @Param('slug') slug: string,
    @Query('lang', LanguageCodePipe) languageCode: string,
  ): Promise<ArticleResponseDto[]> {
    return this.articlesService.findRelatedArticles(slug, languageCode);
  }

  // ===== TRANSLATION ENDPOINTS =====
  @Post(':id/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ArticleTranslationResponseDto)
  createTranslation(
    @Param('id', PositiveIntPipe) articleId: number,
    @Body() dto: CreateArticleTranslationDto,
  ): Promise<ArticleTranslationResponseDto> {
    return this.translations.create(articleId, dto);
  }

  @Post(':id/translations/auto')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ArticleTranslationResponseDto)
  createAutoTranslations(
    @Param('id', PositiveIntPipe) articleId: number,
    @Body() dto: AutoTranslateDto,
  ): Promise<ArticleTranslationResponseDto[]> {
    return this.translations.autoTranslate(articleId, dto);
  }

  @Get(':id/translations')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ArticleTranslationResponseDto)
  listTranslationsByArticle(@Param('id', PositiveIntPipe) articleId: number): Promise<ArticleTranslationResponseDto[]> {
    return this.translations.listByArticle(articleId);
  }

  @Patch(':articleId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @SerializeResponse(ArticleTranslationResponseDto)
  updateTranslation(
    @Param('translationId', PositiveIntPipe) translationId: number,
    @Param('articleId', PositiveIntPipe) articleId: number,
    @Body() dto: UpdateArticleTranslationDto,
  ): Promise<ArticleTranslationResponseDto> {
    return this.translations.update(translationId, articleId, dto);
  }

  @Delete(':articleId/translations/:translationId')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN, Role.AUTHOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTranslation(
    @Param('translationId', PositiveIntPipe) translationId: number,
    @Param('articleId', PositiveIntPipe) articleId: number,
  ): Promise<void> {
    await this.translations.remove(translationId, articleId);
  }
}
