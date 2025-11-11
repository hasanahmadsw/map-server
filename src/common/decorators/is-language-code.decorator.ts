import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsLanguageCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isLanguageCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Allow undefined/null (handled by @IsOptional())
          if (value === undefined || value === null) {
            return true;
          }

          if (typeof value !== 'string') {
            return false;
          }

          // Allow empty string when optional (empty string means "not provided")
          if (value === '') {
            return true;
          }

          // Filter out common non-language-code patterns (like service worker files, etc.)
          // These patterns indicate the request is not for a language code
          // Check for common file extensions and path patterns first
          if (
            value.includes('.') || // contains dot (like sw.js, manifest.json, etc.)
            value.includes('/') || // contains slash (like path/to/file)
            value.includes('\\') || // contains backslash
            value.length > 10 // too long to be a language code (likely a filename or path)
          ) {
            // When optional, treat invalid patterns as "not provided" rather than validation error
            return true;
          }

          // Check if it's exactly 2 characters and all lowercase letters
          const langCodeRegex = /^[a-z]{2}$/;
          return langCodeRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Language code must be exactly 2 lowercase letters (e.g., "en", "fr", "es")';
        },
      },
    });
  };
}
