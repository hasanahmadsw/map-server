import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export type FileType = 'image' | 'audio' | 'video' | 'document';

const mimeTypeMap: Record<FileType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export function createMulterConfig(type: FileType, maxSizeInMB = 5, maxFiles = 1): MulterOptions {
  const allowedMimes = mimeTypeMap[type];

  return {
    storage: memoryStorage(),
    limits: {
      fileSize: maxSizeInMB * 1024 * 1024,
      files: maxFiles,
    },
    fileFilter: (_req, file, cb) => {
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new BadRequestException(`Only ${type} files are allowed: ${allowedMimes.join(', ')}`), false);
      }
      cb(null, true);
    },
  };
}
