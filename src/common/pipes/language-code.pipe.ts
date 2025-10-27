import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class LanguageCodePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('Language code must be a 2 lowercase letters string');
    }

    // Check if it's exactly 2 characters and all lowercase letters
    const langCodeRegex = /^[a-z]{2}$/;

    if (!langCodeRegex.test(value)) {
      throw new BadRequestException('Language code must be exactly 2 lowercase letters (e.g., "en", "fr", "es")');
    }

    return value;
  }
}
