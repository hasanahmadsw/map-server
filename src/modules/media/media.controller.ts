import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/shared/modules/upload/services/upload.service';
import { SupabaseStorageService } from 'src/services/supabase/services/supabase-storage.service';
import { createMulterConfig } from 'src/common/utils/multer-config.factory';
import { Protected } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { SerializeResponse } from 'src/common/decorators/serialize-response.decorator';
import {
  ListMediaQueryDto,
  UploadMediaResponseDto,
  ListMediaResponseDto,
  MediaFileResponseDto,
  DeleteMediaBodyDto,
  DeleteMediaResponseDto,
} from './dtos';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from 'src/shared/modules/config/env.schema';
import { PaginationMetadataDto } from 'src/common/pagination/dto/pagination-detadata.dto';

@Controller('media')
export class MediaController {
  private readonly MEDIA_BUCKET_NAME: string;

  constructor(
    private readonly uploadService: UploadService,
    private readonly supabaseStorageService: SupabaseStorageService,
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {
    this.MEDIA_BUCKET_NAME = this.configService.getOrThrow('PICTURES_BUCKET_NAME');
  }

  @Post('upload')
  @Protected(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10, createMulterConfig('image', 50, 10)))
  @SerializeResponse(UploadMediaResponseDto)
  async uploadMedia(@UploadedFiles() files: Express.Multer.File[]): Promise<UploadMediaResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const urls = await this.uploadService.uploadPictures(files);

    const response = new UploadMediaResponseDto();
    response.urls = urls;

    return response;
  }

  @Get()
  @Protected(Role.SUPER_ADMIN, Role.ADMIN)
  @SerializeResponse(ListMediaResponseDto)
  async listMedia(@Query() query: ListMediaQueryDto): Promise<ListMediaResponseDto> {
    const page = Math.max(1, query.page);
    const limit = Math.max(1, Math.min(query.limit, 100));

    const prefixStartsWith = (query.prefix ?? '').replace(/^\/+/, '');

    let mimePatterns: string[] | null = null;

    if (query.mime && query.mime.length > 0) {
      mimePatterns = query.mime;
    } else if (query.type) {
      switch (query.type) {
        case 'image':
          mimePatterns = ['image/%'];
          break;
        case 'video':
          mimePatterns = ['video/%'];
          break;
        case 'audio':
          mimePatterns = ['audio/%'];
          break;
        case 'all':
          mimePatterns = null;
          break;
      }
    } else {
      mimePatterns = null;
    }

    const { total, items } = await this.supabaseStorageService.listObjectsPagedFlat({
      bucketName: this.MEDIA_BUCKET_NAME,
      page,
      limit,
      signed: query.signed,
      expiresIn: query.expiresIn ?? 3600,
      orderBy: query.orderBy ?? 'name',
      orderDir: query.orderDir ?? 'asc',
      prefixStartsWith: prefixStartsWith || undefined,
      mimePatterns: mimePatterns || undefined,
    });

    const mediaFiles: MediaFileResponseDto[] = items.map((file) => {
      const dto = new MediaFileResponseDto();
      dto.name = file.name;
      dto.path = file.path;
      dto.url = file.url;
      dto.mimeType = file.mimeType;
      dto.size = file.size;
      dto.createdAt = file.createdAt;
      dto.updatedAt = file.updatedAt;
      return dto;
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const paginationMetadata = new PaginationMetadataDto();
    paginationMetadata.currentPage = page;
    paginationMetadata.limit = limit;
    paginationMetadata.total = total;
    paginationMetadata.totalPages = totalPages;
    paginationMetadata.nextPage = hasNextPage ? page + 1 : null;
    paginationMetadata.prevPage = hasPrevPage ? page - 1 : null;
    paginationMetadata.hasNextPage = hasNextPage;
    paginationMetadata.hasPrevPage = hasPrevPage;

    const response = new ListMediaResponseDto();
    response.data = mediaFiles;
    response.pagination = paginationMetadata;
    return response;
  }

  @Delete()
  @Protected(Role.SUPER_ADMIN, Role.ADMIN)
  @SerializeResponse(DeleteMediaResponseDto)
  async deleteMedia(@Body() body: DeleteMediaBodyDto): Promise<DeleteMediaResponseDto> {
    if (!body.paths || body.paths.length === 0) {
      throw new BadRequestException('No file paths provided');
    }

    // Remove leading slashes and ensure paths are clean
    const cleanPaths = body.paths.map((path) => path.replace(/^\/+/, ''));

    await this.supabaseStorageService.deleteFiles(this.MEDIA_BUCKET_NAME, cleanPaths);

    const response = new DeleteMediaResponseDto();
    response.deletedCount = cleanPaths.length;
    response.message = `Successfully deleted ${cleanPaths.length} file(s)`;

    return response;
  }
}
