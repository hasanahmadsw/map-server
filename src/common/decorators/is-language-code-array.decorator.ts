import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsLanguageCodeArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isLanguageCodeArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!Array.isArray(value)) {
            return false;
          }

          // Check if array is empty
          if (value.length === 0) {
            return false;
          }

          // Check if all elements are strings
          if (!value.every((item) => typeof item === 'string')) {
            return false;
          }

          // Check if all elements are valid language codes (2 lowercase letters)
          const langCodeRegex = /^[a-z]{2}$/;
          if (!value.every((item) => langCodeRegex.test(item))) {
            return false;
          }

          // Check if array contains unique values
          const uniqueValues = new Set(value);
          if (uniqueValues.size !== value.length) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Translate to must be a non-empty array of unique 2-letter lowercase language codes (e.g., ["en", "fr", "es"])';
        },
      },
    });
  };
}
