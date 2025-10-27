import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateLanguageDto } from '../dtos/request/create-language.dto';
import { UpdateLanguageDto } from '../dtos/request/update-language.dto';
import { LanguageResponseDto } from '../dtos/response/language-response.dto';
import { LanguageEntity } from '../entities/language.entity';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(LanguageEntity)
    private readonly languageRepository: Repository<LanguageEntity>,
  ) {}

  async create(createLanguageDto: CreateLanguageDto): Promise<LanguageEntity> {
    const codeExists = await this.findByCode(createLanguageDto.code);
    if (codeExists !== null) {
      throw new ConflictException(`A language with the code ${createLanguageDto.code} does already exist`);
    }

    const languagesCount = await this.languageRepository.count();
    if (languagesCount === 0) {
      createLanguageDto.isDefault = true;
    }

    if (createLanguageDto.isDefault) {
      const defaultLanguage = await this.findDefaultLanguage();
      if (defaultLanguage) {
        defaultLanguage.isDefault = false;
        await this.languageRepository.save(defaultLanguage);
      }
    }

    const language = this.languageRepository.create(createLanguageDto);
    return await this.languageRepository.save(language);
  }

  async findAll(): Promise<LanguageResponseDto[]> {
    const languages = await this.languageRepository.find();
    return languages;
  }

  async findOneById(id: number): Promise<LanguageResponseDto> {
    const language = await this.languageRepository.findOne({ where: { id } });

    if (!language) {
      throw new NotFoundException('Language not found');
    }

    return language;
  }

  async findByCode(code: string) {
    if (!code) return null;
    return this.languageRepository.findOneBy({ code });
  }

  async findByCodeOrThrow(code: string) {
    const language = await this.findByCode(code);
    if (!language) {
      throw new NotFoundException(`No language with the code ${code} was found`);
    }
    return language;
  }

  async findDefaultLanguage() {
    const langauge = await this.languageRepository.findOne({ where: { isDefault: true } });
    if (!langauge) {
      throw new NotFoundException(`No default language was found`);
    }
    return langauge;
  }

  async update(code: string, updateLanguageDto: UpdateLanguageDto): Promise<LanguageEntity> {
    const language = await this.findByCodeOrThrow(code);

    if (updateLanguageDto.isDefault === false && language.isDefault === true) {
      if (language.isDefault) {
        throw new BadRequestException(
          `Please make another language default before changing the isDefault of this language`,
        );
      }
    }

    if (updateLanguageDto.isDefault && !language.isDefault) {
      const defaultLanguage = await this.findDefaultLanguage();
      if (defaultLanguage) {
        defaultLanguage.isDefault = false;
        await this.languageRepository.save(defaultLanguage);
      }
    }

    return await this.languageRepository.save({ ...language, ...updateLanguageDto });
  }

  async delete(code: string): Promise<void> {
    const language = await this.findByCodeOrThrow(code);
    if (language.isDefault) {
      throw new BadRequestException(`Please make another language default before deleting this language`);
    }

    await this.languageRepository.delete(language.id);
  }

  /**
   * Ensures that the given language code exists.
   * If not found, throws a NotFoundException.
   * @param code Language code to check
   */
  async ensureLanguageExists(code: string): Promise<void> {
    if (!code) return;
    const exists = await this.languageRepository.exist({ where: { code } });
    if (!exists) {
      throw new NotFoundException(`Language code "${code}" was not found`);
    }
  }

  /**
   * Ensures that all language codes in the provided list exist.
   * If any are missing, throws a NotFoundException listing the missing codes.
   * @param codes Array of language codes to check
   */
  async ensureLanguagesExist(codes: string[]): Promise<void> {
    if (!codes || codes.length === 0) return;

    // Remove duplicates and falsy values
    const uniqueCodes = Array.from(new Set(codes.filter(Boolean)));

    if (uniqueCodes.length === 0) return;

    const foundLanguages = await this.languageRepository.findBy({
      code: In(uniqueCodes),
    });

    const foundCodes = foundLanguages.map((lang) => lang.code);
    const missingCodes = uniqueCodes.filter((code) => !foundCodes.includes(code));

    if (missingCodes.length > 0) {
      throw new NotFoundException(`The following language codes were not found: ${missingCodes.join(', ')}`);
    }
  }
}
