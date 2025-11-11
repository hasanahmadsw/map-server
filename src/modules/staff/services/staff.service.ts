import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStaffDto } from '../dtos/request/create-staff.dto';
import { LoginStaffDto } from '../dtos/request/login-staff.dto';
import { UpdateStaffBySuperAdminDto, UpdateStaffDto } from '../dtos/request/update-staff.dto';
import { StaffResponseDto } from '../dtos/response/staff-response.dto';
import { StaffFilterDto } from '../dtos/query/staff-filter.dto';
import { StaffEntity } from '../entities/staff.entity';
import { PaginationService } from 'src/common/pagination/paginate.service';
import { PaginationResponseDto } from 'src/common/pagination/dto/pagination-response.dto';
import { StaffRole } from '../enums/staff-role.enums';
import { AppJwtService } from 'src/shared/modules/jwt/jwt.service';
import * as bcrypt from 'bcryptjs';
import { LanguagesService } from 'src/modules/languages/services/languages.service';
import { TranslateService } from 'src/services/translation/services/translate.service';
import { TranslationEventTypes } from 'src/services/translation/enums/translated-types.enum';
import { AuthorFilterDto } from '../dtos/query/author-filter.dto';
import { UploadService } from 'src/shared/modules/upload/services/upload.service';
import { FullStaffResponseDto } from '../dtos/response/full-staff-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffEntity)
    private readonly staffRepository: Repository<StaffEntity>,
    private readonly jwtService: AppJwtService,
    private readonly languagesService: LanguagesService,
    private readonly translateService: TranslateService,
    private readonly uploadService: UploadService,
    private readonly paginationService: PaginationService,
  ) {}

  async login(loginStaffDto: LoginStaffDto) {
    const { email, password } = loginStaffDto;

    // Find staff by email
    const staff = await this.staffRepository.findOne({ where: { email } });
    if (!staff) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.jwtService.createAccessToken({
      id: staff.id,
      email: staff.email,
      role: staff.role,
    });

    // Return login response
    return {
      accessToken,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
    };
  }

  async uploadPicture(picture: Express.Multer.File): Promise<{ url: string }> {
    const url = await this.uploadService.uploadPicture(picture);
    return { url };
  }

  async create(createStaffDto: CreateStaffDto): Promise<StaffEntity> {
    const existingStaff = await this.staffRepository.findOne({
      where: { email: createStaffDto.email },
    });

    if (existingStaff) {
      throw new ConflictException('Staff with this email already exists');
    }

    await this.languagesService.ensureLanguagesExist([...createStaffDto.translateTo, createStaffDto.languageCode]);

    // Create staff and its default translation in a transaction
    const savedStaff = await this.staffRepository.manager.transaction(async (manager) => {
      // Create the staff entity
      const staff = manager.create(StaffEntity, createStaffDto);
      const savedStaff = await manager.save(StaffEntity, staff);

      // Create the default translation with the bio and languageCode
      if (createStaffDto.bio && createStaffDto.languageCode) {
        const translation = manager.create('StaffTranslationEntity', {
          staff: savedStaff,
          bio: createStaffDto.bio,
          languageCode: createStaffDto.languageCode,
        });
        await manager.save('StaffTranslationEntity', translation);
      }

      return savedStaff;
    });

    await this.translateService.translateToLanguages(
      createStaffDto.translateTo,
      TranslationEventTypes.staff,
      savedStaff.id,
      { bio: createStaffDto.bio },
    );

    return savedStaff;
  }

  async update(staff: StaffEntity, updateStaffDto: UpdateStaffDto): Promise<StaffEntity> {
    const updatedStaff = this.staffRepository.merge(staff, updateStaffDto);
    const savedStaff = await this.staffRepository.save(updatedStaff);
    return savedStaff;
  }

  async delete(id: number): Promise<void> {
    const staff = await this.findOne(id, null);

    if (staff.role == StaffRole.SUPERADMIN) {
      throw new ForbiddenException('Cannot delete SuperAdmin');
    }

    await this.staffRepository.remove(staff);
  }

  async findAll(filterStaffDto: StaffFilterDto): Promise<PaginationResponseDto<StaffResponseDto>> {
    const queryBuilder = this.staffRepository
      .createQueryBuilder('staff')
      .leftJoinAndSelect('staff.translations', 'translations');

    if (filterStaffDto.name) {
      queryBuilder.andWhere('staff.name ILIKE :name', {
        name: `%${filterStaffDto.name}%`,
      });
    }
    if (filterStaffDto.email) {
      queryBuilder.andWhere('staff.email = :email', { email: filterStaffDto.email });
    }

    return this.paginationService.paginateSafeQB(queryBuilder, filterStaffDto, {
      primaryId: 'staff.id',
      createdAt: 'staff.createdAt',
      map: (e) => plainToInstance(FullStaffResponseDto, e, { excludeExtraneousValues: true }),
    });
  }

  async findAuthors(filterAuthorDto: AuthorFilterDto) {
    const queryBuilder = this.staffRepository
      .createQueryBuilder('staff')
      .innerJoinAndSelect('staff.translations', 'translations')
      .where('translations.languageCode = :languageCode', { languageCode: filterAuthorDto.languageCode })
      .andWhere('staff.role = :role', { role: StaffRole.AUTHOR });

    return this.paginationService.paginateSafeQB(queryBuilder, filterAuthorDto, {
      primaryId: 'staff.id',
      createdAt: 'staff.createdAt',
      map: (e) => plainToInstance(StaffResponseDto, e, { excludeExtraneousValues: true }),
    });
  }

  async findOneAuthor(id: number, languageCode: string) {
    const author = this.staffRepository
      .createQueryBuilder('staff')
      .innerJoinAndSelect('staff.translations', 'translations')
      .where('translations.languageCode = :languageCode', { languageCode })
      .andWhere('staff.id = :id', { id })
      .getOne();

    if (!author) {
      throw new NotFoundException('Author not found');
    }
    console.log(author);
    return author;
  }

  async findOne(id: number, role?: StaffRole): Promise<StaffEntity> {
    const whereCondition: any = { id };
    if (role !== null && role !== undefined) {
      whereCondition.role = role;
    }

    const staff = await this.staffRepository.findOne({
      where: whereCondition,
      relations: ['translations'],
    });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }
    return staff;
  }

  async updateBySuperAdmin(id: number, updateStaffDto: UpdateStaffBySuperAdminDto): Promise<StaffEntity> {
    const staff = await this.staffRepository.findOne({
      where: { id },
    });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (staff.role == StaffRole.SUPERADMIN) {
      throw new ForbiddenException('Cannot update SuperAdmin');
    }

    let previousImage = null;
    if (updateStaffDto.image) {
      previousImage = staff.image;
    }

    const updatedStaff = this.staffRepository.merge(staff, updateStaffDto);
    const savedStaff = await this.staffRepository.save(updatedStaff);

    if (previousImage) {
      this.uploadService.deleteFiles([previousImage]);
    }

    return savedStaff;
  }

  async findOneByEmail(email: string): Promise<StaffEntity> {
    const staff = await this.staffRepository.findOne({
      where: { email },
    });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }
    return staff;
  }
}
