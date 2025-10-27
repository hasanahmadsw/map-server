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
}
