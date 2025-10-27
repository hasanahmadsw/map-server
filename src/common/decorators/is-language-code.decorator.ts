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
          if (typeof value !== 'string') {
            return false;
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
