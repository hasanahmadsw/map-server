import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ArticleTranslationEntity } from '../entities/article-translation.entity';
import { ArticleEntity } from '../entities/article.entity';
import { CreateArticleTranslationDto } from '../dtos/request/create-article-translation.dto';
import { UpdateArticleTranslationDto } from '../dtos/request/update-article-translation.dto';
import { ArticleTranslationResponseDto } from '../dtos/response/article-translation-response.dto';
import { plainToInstance } from 'class-transformer';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';

@Injectable()
export class ArticleTranslationsService {
  constructor(
    @InjectRepository(ArticleTranslationEntity) private readonly translationsRepo: Repository<ArticleTranslationEntity>,
    @InjectRepository(ArticleEntity) private readonly articlesRepo: Repository<ArticleEntity>,
    private readonly languagesService: LanguagesService,
    private readonly translateService: TranslateService,
  ) {}

  async create(articleId: number, dto: CreateArticleTranslationDto): Promise<ArticleTranslationResponseDto> {
    const articleExists = await this.articlesRepo.exist({ where: { id: articleId } });
    if (!articleExists) throw new NotFoundException('Article not found');

    const exists = await this.translationsRepo.exist({
      where: { articleId, languageCode: dto.languageCode },
    });
    if (exists) throw new ConflictException('Translation already exists for this article and language');

    await this.languagesService.ensureLanguageExists(dto.languageCode);

    const saved = await this.translationsRepo.save(this.translationsRepo.create({ ...dto, articleId }));
    return this.getById(saved.id);
  }

  async listByArticle(articleId: number): Promise<ArticleTranslationResponseDto[]> {
    // ensure that the article exists
    const articleExists = await this.articlesRepo.exist({ where: { id: articleId } });
    if (!articleExists) throw new NotFoundException('Article not found');

    const translations = await this.translationsRepo.find({ where: { articleId }, relations: ['language'] });
    return translations.map((t) =>
      plainToInstance(ArticleTranslationResponseDto, t, { enableImplicitConversion: true }),
    );
  }

  async getById(id: number): Promise<ArticleTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({ where: { id }, relations: ['language'] });
    if (!translation) throw new NotFoundException('Article translation not found');
    return plainToInstance(ArticleTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async getByArticleAndLanguage(articleId: number, languageCode: string): Promise<ArticleTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({
      where: { articleId, languageCode },
      relations: ['language'],
    });
    if (!translation)
      throw new NotFoundException(`Translation not found for article ${articleId} and language ${languageCode}`);
    return plainToInstance(ArticleTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async listAll(): Promise<ArticleTranslationResponseDto[]> {
    const translations = await this.translationsRepo.find({ relations: ['language'] });
    return translations.map((t) =>
      plainToInstance(ArticleTranslationResponseDto, t, { enableImplicitConversion: true }),
    );
  }

  async autoTranslate(articleId: number, dto: AutoTranslateDto): Promise<ArticleTranslationResponseDto[]> {
    const article = await this.articlesRepo.findOne({ where: { id: articleId } });
    if (!article) throw new NotFoundException('Article not found');

    const translateTo = dto.translateTo;

    // ensure the languages exist
    await this.languagesService.ensureLanguagesExist(translateTo);

    // For each language, if a translation exists for this article, delete it
    const existingTranslations = await this.translationsRepo.find({
      where: { articleId, languageCode: In(translateTo) },
    });
    if (existingTranslations.length > 0) {
      const existingCodes = existingTranslations.map((t) => t.languageCode);
      throw new ConflictException(
        `Some translations already exist for the specified languages: ${existingCodes.join(', ')}`,
      );
    }

    // get the default translation of this article
    const defaultTranslation = await this.translationsRepo.findOne({ where: { articleId, isDefault: true } });
    if (!defaultTranslation) throw new NotFoundException('Default translation not found');

    // translate the article
    await this.translateService.translateToLanguages(translateTo, TranslationEventTypes.article, articleId, {
      content: defaultTranslation.content,
      excerpt: defaultTranslation.excerpt,
      meta: defaultTranslation.meta,
    });

    return this.translationsRepo.find({ where: { articleId } });
  }

  async update(
    id: number,
    articleId: number,
    dto: UpdateArticleTranslationDto,
  ): Promise<ArticleTranslationResponseDto> {
    const existing = await this.translationsRepo.findOne({ where: { id, articleId } });
    if (!existing) throw new NotFoundException('Article translation not found');

    const saved = await this.translationsRepo.save(this.translationsRepo.merge(existing, dto));
    return this.getById(saved.id);
  }

  async remove(id: number, articleId: number): Promise<void> {
    const translation = await this.translationsRepo.findOne({ where: { id, articleId } });
    if (!translation) throw new NotFoundException('Article translation not found');

    if (translation.isDefault) throw new BadRequestException('Default translation cannot be deleted');

    await this.translationsRepo.delete(id);
  }
}
