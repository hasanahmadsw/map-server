import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from 'src/shared/modules/config/env.schema';
import { Semaphore } from 'src/common/utils/semaphore';

@Injectable()
export class SupabaseStorageService {
  private readonly client: SupabaseClient;
  private readonly semaphore: Semaphore;

  constructor(private readonly configService: ConfigService<EnvironmentConfig, true>) {
    try {
      this.client = createClient(
        this.configService.getOrThrow('SUPABASE_URL'),
        this.configService.getOrThrow('SUPABASE_KEY'),
      );
      // Initialize semaphore with 20 concurrent requests to avoid overwhelming Supabase API
      this.semaphore = new Semaphore(20);
    } catch (err) {
      throw new Error('An error occurred while starting supabase service. The app is stopping');
    }
  }

  async uploadFile(
    bucketName: string,
    path: string,
    file: Buffer,
    contentType: string,
    metadata?: any,
  ): Promise<string> {
    try {
      await this.semaphore.acquire();

      const { data, error } = await this.client.storage.from(bucketName).upload(path, file, {
        contentType,
        upsert: false,
        ...(metadata && { metadata }),
      });

      if (error) {
        throw new InternalServerErrorException(`Error uploading file: ${error?.message}`);
      }

      const { data: urlData } = this.client.storage.from(bucketName).getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      throw new InternalServerErrorException(`Error uploading file: ${error}`);
    } finally {
      this.semaphore.release();
    }
  }

  async deleteFiles(bucketName: string, paths: string[]): Promise<void> {
    await this.semaphore.acquire();
    console.log(paths);
    const { error } = await this.client.storage.from(bucketName).remove(paths);
    if (error) {
      throw new InternalServerErrorException(`Error deleting file: ${error}`);
    }

    this.semaphore.release();
  }

  async listObjectsPagedFlat(params: {
    bucketName: string;
    page: number;
    limit: number;
    signed?: boolean;
    expiresIn?: number;
    prefixStartsWith?: string;
    mimePatterns?: string[];
    orderBy?: 'name' | 'created_at' | 'updated_at';
    orderDir?: 'asc' | 'desc';
  }): Promise<{
    total: number;
    items: Array<{
      name: string;
      path: string;
      mimeType?: string;
      size?: number;
      url: string;
      createdAt?: string;
      updatedAt?: string;
    }>;
  }> {
    const {
      bucketName,
      page,
      limit,
      signed = false,
      expiresIn = 3600,
      prefixStartsWith,
      mimePatterns = null,
      orderBy = 'name',
      orderDir = 'asc',
    } = params;

    if (page < 1) throw new InternalServerErrorException('page must be >= 1');
    if (limit < 1) throw new InternalServerErrorException('limit must be >= 1');

    const offset = (page - 1) * limit;
    const prefix = (prefixStartsWith ?? '').replace(/^\/+/, '') || null;

    const { data, error } = await this.client.rpc('list_storage_objects_flat', {
      p_bucket: bucketName,
      p_prefix: prefix,
      p_offset: offset,
      p_limit: limit,
      p_mime_patterns: mimePatterns,
      p_order_by: orderBy,
      p_order_dir: orderDir,
    });

    if (error) {
      throw new InternalServerErrorException(`Error listing objects (flat): ${error.message}`);
    }

    const rows = (data ?? []) as Array<{
      total: number;
      name: string;
      metadata: { mimetype?: string; size?: number } | null;
      created_at: string;
      updated_at: string;
    }>;

    const total = rows[0]?.total ?? 0;

    const items: Array<{
      name: string;
      path: string;
      mimeType?: string;
      size?: number;
      url: string;
      createdAt?: string;
      updatedAt?: string;
    }> = [];
    for (const row of rows) {
      const path = row.name;
      const mimeType = row.metadata?.mimetype;
      const size = row.metadata?.size;

      await this.semaphore.acquire();
      try {
        let url = '';
        if (signed) {
          const { data: sdata, error: serror } = await this.client.storage
            .from(bucketName)
            .createSignedUrl(path, expiresIn);
          if (serror)
            throw new InternalServerErrorException(`Error creating signed URL for ${path}: ${serror.message}`);
          url = sdata.signedUrl;
        } else {
          const { data: udata } = this.client.storage.from(bucketName).getPublicUrl(path);
          url = udata.publicUrl;
        }

        items.push({
          name: path,
          path,
          mimeType,
          size,
          url,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      } finally {
        this.semaphore.release();
      }
    }

    return { total, items };
  }
}
