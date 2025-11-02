import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { UploadModule } from 'src/shared/modules/upload/upload.module';
import { SupabaseModule } from 'src/services/supabase/supabase.module';

@Module({
  imports: [UploadModule, SupabaseModule],
  controllers: [MediaController],
})
export class MediaModule {}
