import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, SelectQueryBuilder } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreateArticleDto } from '../dtos/request/create-article.dto';
import { UpdateArticleDto } from '../dtos/request/update-article.dto';
import { ArticleResponseDto } from '../dtos/response/article-response.dto';
import { ArticleFilterDto } from '../dtos/query/article-filter.dto';
import { ArticleEntity } from '../entities/article.entity';
import { ArticleTranslationEntity } from '../entities/article-translation.entity';
import { PaginationService } from 'src/common/pagination/paginate.service';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { PublicArticleFilterDto } from '../dtos/query/public-article-filter.dto';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { StaffEntity } from 'src/modules/staff/entities/staff.entity';
import { StaffRole } from 'src/modules/staff/enums/staff-role.enums';
import { UploadService } from 'src/shared/modules/upload/services/upload.service';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    private readonly translateService: TranslateService,
    private readonly languagesService: LanguagesService,
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService,
  ) {}

  async uploadPicture(picture: Express.Multer.File): Promise<{ url: string }> {
    const url = await this.uploadService.uploadPicture(picture);
    return { url };
  }

  async create(author: StaffEntity, createArticleDto: CreateArticleDto): Promise<ArticleResponseDto> {
    const { tags, topics, languageCode, name, content, excerpt, meta, ...articleData } = createArticleDto;

    // slug must be unique
    const exists = await this.articleRepository.exist({ where: { slug: articleData.slug } });
    if (exists) throw new ConflictException('Slug already exists');

    // ensure the languages exist
    await this.languagesService.ensureLanguagesExist([...createArticleDto.translateTo, languageCode]);

    // omit the default language code
    const translateTo = createArticleDto.translateTo.filter((code) => code !== languageCode);

    // language must exist
    await this.languagesService.ensureLanguageExists(languageCode);

    const id = await this.dataSource.transaction(async (trx) => {
      // Create the article
      const article = trx.getRepository(ArticleEntity).create({
        slug: articleData.slug,
        isPublished: articleData.isPublished ?? false,
        isFeatured: articleData.isFeatured ?? false,
        viewCount: 0,
        authorId: author.id,
        image: articleData.image,
        tags: tags ?? [],
        topics: topics ?? [],
      });
      const savedArticle = await trx.getRepository(ArticleEntity).save(article);

      // Create the default translation
      const translation = trx.getRepository(ArticleTranslationEntity).create({
        articleId: savedArticle.id,
        languageCode: languageCode,
        name,
        content,
        excerpt: excerpt ?? null,
        meta: meta ?? null,
        isDefault: true,
      });
      await trx.getRepository(ArticleTranslationEntity).save(translation);

      return savedArticle.id;
    });

    if (translateTo.length > 0) {
      this.translateService.translateToLanguages(translateTo, TranslationEventTypes.article, id, {
        name,
        content,
        excerpt,
        meta,
      });
    }

    return this.getById(id);
  }

  async findAll(filterArticleDto: ArticleFilterDto): Promise<PaginationResponseDto<ArticleResponseDto>> {
    const qb = this.buildBaseQB();

    // Search by slug or translation content
    if (filterArticleDto.search) {
      qb.andWhere('translations.name ILIKE :search', { search: `%${filterArticleDto.search}%` });
    }

    // Filter by slug
    if (filterArticleDto.slug) {
      qb.andWhere('article.slug = :slug', { slug: filterArticleDto.slug });
    }

    // Filter by published status
    if (filterArticleDto.isPublished !== undefined) {
      qb.andWhere('article.isPublished = :isPublished', {
        isPublished: filterArticleDto.isPublished,
      });
    }

    // Filter by featured status
    if (filterArticleDto.isFeatured !== undefined) {
      qb.andWhere('article.isFeatured = :isFeatured', {
        isFeatured: filterArticleDto.isFeatured,
      });
    }

    // Filter by language
    if (filterArticleDto.languageCode) {
      qb.andWhere('translations.languageCode = :languageCode', { languageCode: filterArticleDto.languageCode });
    }

    // Filter by tags
    if (filterArticleDto.tag) {
      qb.andWhere('article.tags @> :tag', { tag: [filterArticleDto.tag] });
    }

    // Filter by topics
    if (filterArticleDto.topic) {
      qb.andWhere('article.topics @> :topic', { topic: [filterArticleDto.topic] });
    }

    // Sorting
    if (filterArticleDto.sortBy) {
      const sortOrder = filterArticleDto.sortOrder || 'ASC';
      qb.orderBy(`article.${filterArticleDto.sortBy}`, sortOrder);
    } else {
      qb.orderBy('article.createdAt', 'DESC');
    }

    return this.paginationService.paginateSafeQB(qb, filterArticleDto, {
      primaryId: 'article.id',
      createdAt: 'article.createdAt',
      map: (e) => plainToInstance(ArticleResponseDto, e, { excludeExtraneousValues: true }),
    });
  }

  async getById(id: number): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['translations', 'author'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return plainToInstance(ArticleResponseDto, article, { enableImplicitConversion: true });
  }

  async findBySlug(slug: string): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Increment view count
    article.viewCount += 1;
    await this.articleRepository.save(article);

    return article;
  }

  async findRelatedArticles(slug: string, languageCode: string): Promise<ArticleResponseDto[]> {
    const article = await this.articleRepository.findOne({ where: { slug } });
    if (!article) throw new NotFoundException('Article not found');

    const articleTopics = article.topics || [];

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .innerJoinAndSelect('article.translations', 'translations', 'translations.languageCode = :languageCode', {
        languageCode,
      })
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect(
        'author.translations',
        'authorTranslations',
        'authorTranslations.languageCode = :languageCode',
        {
          languageCode,
        },
      )
      .where('article.id != :id', { id: article.id })
      .andWhere('article.isPublished = :isPublished', { isPublished: true });

    // Find articles that share at least one topic
    if (articleTopics.length > 0) {
      qb.andWhere('article.topics && :topics', { topics: articleTopics });
    }

    qb.orderBy('article.createdAt', 'DESC').take(10);

    return qb.getMany();
  }

  async update(id: number, author: StaffEntity, updateArticleDto: UpdateArticleDto): Promise<ArticleResponseDto> {
    const article = await this.findArticleAndValidateOwnership(id, author, ['translations']);

    // Extract tags and topics
    const { tags, topics, ...articleData } = updateArticleDto;

    // if slug changes, enforce uniqueness
    if (articleData.slug && articleData.slug !== article.slug) {
      const exists = await this.articleRepository.exist({ where: { slug: articleData.slug } });
      if (exists) throw new ConflictException('Slug already exists');
    }

    // Update basic article data
    Object.assign(article, articleData);

    // Handle tags if provided
    if (tags !== undefined) {
      article.tags = tags || [];
    }

    // Handle topics if provided
    if (topics !== undefined) {
      article.topics = topics || [];
    }

    const savedArticle = await this.articleRepository.save(article);

    // Reload with relationships for response
    return this.getById(savedArticle.id);
  }

  async delete(id: number, author: StaffEntity): Promise<void> {
    const article = await this.findArticleAndValidateOwnership(id, author);

    await this.articleRepository.delete(id);
  }

  async publish(id: number, author: StaffEntity): Promise<ArticleResponseDto> {
    const article = await this.findArticleAndValidateOwnership(id, author);

    article.isPublished = true;
    const savedArticle = await this.articleRepository.save(article);

    return this.getById(savedArticle.id);
  }

  async unpublish(id: number, author: StaffEntity): Promise<ArticleResponseDto> {
    const article = await this.findArticleAndValidateOwnership(id, author);

    article.isPublished = false;
    const savedArticle = await this.articleRepository.save(article);

    return this.getById(savedArticle.id);
  }

  async toggleFeatured(id: number, author: StaffEntity): Promise<ArticleResponseDto> {
    const article = await this.findArticleAndValidateOwnership(id, author);

    article.isFeatured = !article.isFeatured;
    const savedArticle = await this.articleRepository.save(article);

    return this.getById(savedArticle.id);
  }

  async getPublishedArticles(filter: PublicArticleFilterDto): Promise<PaginationResponseDto<ArticleResponseDto>> {
    const languageCode = filter.lang;
    await this.languagesService.ensureLanguageExists(languageCode);

    const qb = this.buildBaseQB(languageCode).andWhere('article.isPublished = :isPublished', { isPublished: true });

    // Apply additional filters if provided
    if (filter) {
      if (filter.search) {
        qb.andWhere('translations.name ILIKE :search', { search: `%${filter.search}%` });
      }

      if (filter.isFeatured !== undefined) {
        qb.andWhere('article.isFeatured = :isFeatured', { isFeatured: filter.isFeatured });
      }

      if (filter.tag) {
        qb.andWhere('article.tags @> :tag', { tag: [filter.tag] });
      }

      if (filter.topic) {
        qb.andWhere('article.topics @> :topic', { topic: [filter.topic] });
      }

      if (filter.sortBy) {
        const sortOrder = filter.sortOrder || 'ASC';
        qb.orderBy(`article.${filter.sortBy}`, sortOrder);
      } else {
        qb.orderBy('article.createdAt', 'DESC');
      }
    } else {
      qb.orderBy('article.createdAt', 'DESC');
    }

    // Get paginated results with raw entities
    return this.paginationService.paginateSafeQB(qb, filter, {
      primaryId: 'article.id',
      createdAt: 'article.createdAt',
      map: (e) => plainToInstance(ArticleResponseDto, e, { excludeExtraneousValues: true }),
    });
  }

  async getFeaturedArticles(filter: PublicArticleFilterDto): Promise<PaginationResponseDto<ArticleResponseDto>> {
    const languageCode = filter.lang;
    await this.languagesService.ensureLanguageExists(languageCode);

    const qb = this.buildBaseQB(languageCode)
      .andWhere('article.isFeatured = :isFeatured', { isFeatured: true })
      .andWhere('article.isPublished = :isPublished', { isPublished: true });

    // Apply additional filters if provided
    if (filter) {
      if (filter.search) {
        qb.andWhere('translations.name ILIKE :search', { search: `%${filter.search}%` });
      }

      if (filter.tag) {
        qb.andWhere('article.tags @> :tag', { tag: [filter.tag] });
      }

      if (filter.topic) {
        qb.andWhere('article.topics @> :topic', { topic: [filter.topic] });
      }

      if (filter.sortBy) {
        const sortOrder = filter.sortOrder || 'ASC';
        qb.orderBy(`article.${filter.sortBy}`, sortOrder);
      } else {
        qb.orderBy('article.createdAt', 'DESC');
      }
    } else {
      qb.orderBy('article.createdAt', 'DESC');
    }

    // Get paginated results with raw entities
    return this.paginationService.paginateSafeQB(qb, filter, {
      primaryId: 'article.id',
      createdAt: 'article.createdAt',
      map: (e) => plainToInstance(ArticleResponseDto, e, { excludeExtraneousValues: true }),
    });
  }

  async getBySlugPublic(slug: string, languageCode: string): Promise<ArticleResponseDto> {
    await this.languagesService.ensureLanguageExists(languageCode);

    const article = await this.buildBaseQB(languageCode)
      .andWhere('article.slug = :slug', { slug })
      .andWhere('article.isPublished = :isPublished', { isPublished: true })
      .andWhere('translations.languageCode = :languageCode', { languageCode })
      .getOne();

    if (!article) throw new NotFoundException('Article not found');

    // Increment view count without saving relations
    await this.articleRepository.update(article.id, { viewCount: article.viewCount + 1 });

    return article;
  }

  // ---------- Helpers ----------

  private async findArticleAndValidateOwnership(
    id: number,
    author: StaffEntity,
    relations?: string[],
  ): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOne({ where: { id }, ...(relations ? { relations } : {}) });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Allow superadmin to update any article, otherwise check ownership
    if (article.authorId !== author.id && author.role !== StaffRole.SUPERADMIN) {
      throw new ForbiddenException('You are not the author of this article');
    }

    return article;
  }

  private buildBaseQB(languageCode?: string): SelectQueryBuilder<ArticleEntity> {
    const qb = this.articleRepository.createQueryBuilder('article').leftJoinAndSelect('article.author', 'author');

    if (languageCode) {
      qb.innerJoinAndSelect('article.translations', 'translations', 'translations.languageCode = :languageCode', {
        languageCode,
      });
      qb.leftJoinAndSelect(
        'author.translations',
        'authorTranslations',
        'authorTranslations.languageCode = :languageCode',
        { languageCode },
      );
    } else {
      qb.leftJoinAndSelect('article.translations', 'translations');
      qb.leftJoinAndSelect('author.translations', 'authorTranslations');
    }

    qb.orderBy('article.createdAt', 'DESC');

    return qb;
  }
}
