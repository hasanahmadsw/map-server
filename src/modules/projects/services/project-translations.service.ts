import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProjectTranslationEntity } from '../entities/project-translation.entity';
import { ProjectEntity } from '../entities/project.entity';
import { CreateProjectTranslationDto } from '../dtos/request/create-project-translation.dto';
import { UpdateProjectTranslationDto } from '../dtos/request/update-project-translation.dto';
import { ProjectTranslationResponseDto } from '../dtos/response/project-translation-response.dto';
import { plainToInstance } from 'class-transformer';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';

@Injectable()
export class ProjectTranslationsService {
  constructor(
    @InjectRepository(ProjectTranslationEntity)
    private readonly translationsRepo: Repository<ProjectTranslationEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectsRepo: Repository<ProjectEntity>,
    private readonly languagesService: LanguagesService,
    private readonly translateService: TranslateService,
  ) {}

  async create(projectId: number, dto: CreateProjectTranslationDto): Promise<ProjectTranslationResponseDto> {
    const projectExists = await this.projectsRepo.exist({ where: { id: projectId } });
    if (!projectExists) throw new NotFoundException('Project not found');

    const exists = await this.translationsRepo.exist({
      where: { projectId, languageCode: dto.languageCode },
    });
    if (exists) throw new ConflictException('Translation already exists for this project and language');

    await this.languagesService.ensureLanguageExists(dto.languageCode);

    const saved = await this.translationsRepo.save(this.translationsRepo.create({ ...dto, projectId }));
    return this.getById(saved.id);
  }

  async listByProject(projectId: number): Promise<ProjectTranslationResponseDto[]> {
    // ensure that the project exists
    const projectExists = await this.projectsRepo.exist({ where: { id: projectId } });
    if (!projectExists) throw new NotFoundException('Project not found');

    const translations = await this.translationsRepo.find({ where: { projectId }, relations: ['language'] });
    return translations.map((t) =>
      plainToInstance(ProjectTranslationResponseDto, t, { enableImplicitConversion: true }),
    );
  }

  async getById(id: number): Promise<ProjectTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({ where: { id }, relations: ['language'] });
    if (!translation) throw new NotFoundException('Project translation not found');
    return plainToInstance(ProjectTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async getByProjectAndLanguage(projectId: number, languageCode: string): Promise<ProjectTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({
      where: { projectId, languageCode },
      relations: ['language'],
    });
    if (!translation)
      throw new NotFoundException(`Translation not found for project ${projectId} and language ${languageCode}`);
    return plainToInstance(ProjectTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async listAll(): Promise<ProjectTranslationResponseDto[]> {
    const translations = await this.translationsRepo.find({ relations: ['language'] });
    return translations.map((t) =>
      plainToInstance(ProjectTranslationResponseDto, t, { enableImplicitConversion: true }),
    );
  }

  async autoTranslate(projectId: number, dto: AutoTranslateDto): Promise<ProjectTranslationResponseDto[]> {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const translateTo = dto.translateTo;

    // ensure the languages exist
    await this.languagesService.ensureLanguagesExist(translateTo);

    // For each language, if a translation exists for this project, delete it
    const existingTranslations = await this.translationsRepo.find({
      where: { projectId, languageCode: In(translateTo) },
    });
    if (existingTranslations.length > 0) {
      const existingCodes = existingTranslations.map((t) => t.languageCode);
      throw new ConflictException(
        `Some translations already exist for the specified languages: ${existingCodes.join(', ')}`,
      );
    }

    // get the default translation of this project
    const defaultTranslation = await this.translationsRepo.findOne({ where: { projectId, isDefault: true } });
    if (!defaultTranslation) throw new NotFoundException('Default translation not found');

    // translate the project
    await this.translateService.translateToLanguages(translateTo, TranslationEventTypes.project, projectId, {
      name: defaultTranslation.name,
      description: defaultTranslation.description,
      shortDescription: defaultTranslation.shortDescription,
      meta: defaultTranslation.meta,
      challenges: defaultTranslation.challenges,
      results: defaultTranslation.results,
    });

    return this.translationsRepo.find({ where: { projectId } });
  }

  async update(
    id: number,
    projectId: number,
    dto: UpdateProjectTranslationDto,
  ): Promise<ProjectTranslationResponseDto> {
    const existing = await this.translationsRepo.findOne({ where: { id, projectId } });
    if (!existing) throw new NotFoundException('Project translation not found');

    const saved = await this.translationsRepo.save(this.translationsRepo.merge(existing, dto));
    return this.getById(saved.id);
  }

  async remove(id: number, projectId: number): Promise<void> {
    const translation = await this.translationsRepo.findOne({ where: { id, projectId } });
    if (!translation) throw new NotFoundException('Project translation not found');

    if (translation.isDefault) throw new BadRequestException('Default translation cannot be deleted');

    await this.translationsRepo.delete(id);
  }
}
