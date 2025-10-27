import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SolutionTranslationEntity } from '../entities/solution-translation.entity';
import { SolutionEntity } from '../entities/solution.entity';
import { CreateSolutionTranslationDto } from '../dtos/request/create-solution-translation.dto';
import { UpdateSolutionTranslationDto } from '../dtos/request/update-solution-translation.dto';
import { SolutionTranslationResponseDto } from '../dtos/response/solution-translation-response.dto';
import { plainToInstance } from 'class-transformer';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { AutoTranslateDto } from 'src/common/dtos/request/auto-translate.dto';

@Injectable()
export class SolutionTranslationsService {
  constructor(
    @InjectRepository(SolutionTranslationEntity)
    private readonly translationsRepo: Repository<SolutionTranslationEntity>,
    @InjectRepository(SolutionEntity) private readonly solutionsRepo: Repository<SolutionEntity>,
    private readonly languagesService: LanguagesService,
    private readonly translateService: TranslateService,
  ) {}

  async create(solutionId: number, dto: CreateSolutionTranslationDto): Promise<SolutionTranslationResponseDto> {
    const solutionExists = await this.solutionsRepo.exist({ where: { id: solutionId } });
    if (!solutionExists) throw new NotFoundException('Solution not found');

    const exists = await this.translationsRepo.exist({
      where: { solutionId, languageCode: dto.languageCode },
    });
    if (exists) throw new ConflictException('Translation already exists for this solution and language');

    await this.languagesService.ensureLanguageExists(dto.languageCode);

    const saved = await this.translationsRepo.save(this.translationsRepo.create({ ...dto, solutionId }));
    return this.getById(saved.id);
  }

  async listBySolution(solutionId: number): Promise<SolutionTranslationResponseDto[]> {
    // ensure that the solution exists
    const solutionExists = await this.solutionsRepo.exist({ where: { id: solutionId } });
    if (!solutionExists) throw new NotFoundException('Solution not found');

    const translations = await this.translationsRepo.find({ where: { solutionId }, relations: ['language'] });
    return translations.map((t) =>
      plainToInstance(SolutionTranslationResponseDto, t, { enableImplicitConversion: true }),
    );
  }

  async getById(id: number): Promise<SolutionTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({ where: { id }, relations: ['language'] });
    if (!translation) throw new NotFoundException('Solution translation not found');
    return plainToInstance(SolutionTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async getBySolutionAndLanguage(solutionId: number, languageCode: string): Promise<SolutionTranslationResponseDto> {
    const translation = await this.translationsRepo.findOne({
      where: { solutionId, languageCode },
      relations: ['language'],
    });
    if (!translation)
      throw new NotFoundException(`Translation not found for solution ${solutionId} and language ${languageCode}`);
    return plainToInstance(SolutionTranslationResponseDto, translation, { enableImplicitConversion: true });
  }

  async listAll(): Promise<SolutionTranslationResponseDto[]> {
    const translations = await this.translationsRepo.find({ relations: ['language'] });
    return translations.map((t) =>
      plainToInstance(SolutionTranslationResponseDto, t, { enableImplicitConversion: true }),
    );
  }

  async autoTranslate(solutionId: number, dto: AutoTranslateDto): Promise<SolutionTranslationResponseDto[]> {
    const solution = await this.solutionsRepo.findOne({ where: { id: solutionId } });
    if (!solution) throw new NotFoundException('Solution not found');

    const translateTo = dto.translateTo;

    // ensure the languages exist
    await this.languagesService.ensureLanguagesExist(translateTo);

    // For each language, if a translation exists for this solution, delete it
    const existingTranslations = await this.translationsRepo.find({
      where: { solutionId, languageCode: In(translateTo) },
    });
    if (existingTranslations.length > 0) {
      const existingCodes = existingTranslations.map((t) => t.languageCode);
      throw new ConflictException(
        `Some translations already exist for the specified languages: ${existingCodes.join(', ')}`,
      );
    }

    // get the default translation of this solution
    const defaultTranslation = await this.translationsRepo.findOne({ where: { solutionId, isDefault: true } });
    if (!defaultTranslation) throw new NotFoundException('Default translation not found');

    // translate the solution
    await this.translateService.translateToLanguages(translateTo, TranslationEventTypes.solution, solutionId, {
      name: defaultTranslation.name,
      description: defaultTranslation.description,
      shortDescription: defaultTranslation.shortDescription,
      meta: defaultTranslation.meta,
    });

    return this.translationsRepo.find({ where: { solutionId } });
  }

  async update(
    id: number,
    solutionId: number,
    dto: UpdateSolutionTranslationDto,
  ): Promise<SolutionTranslationResponseDto> {
    const existing = await this.translationsRepo.findOne({ where: { id, solutionId } });
    if (!existing) throw new NotFoundException('Solution translation not found');

    const saved = await this.translationsRepo.save(this.translationsRepo.merge(existing, dto));
    return this.getById(saved.id);
  }

  async remove(id: number, solutionId: number): Promise<void> {
    const translation = await this.translationsRepo.findOne({ where: { id, solutionId } });
    if (!translation) throw new NotFoundException('Solution translation not found');

    if (translation.isDefault) throw new BadRequestException('Default translation cannot be deleted');

    await this.translationsRepo.delete(id);
  }
}
