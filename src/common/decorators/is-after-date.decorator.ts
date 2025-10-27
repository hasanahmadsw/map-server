import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsAfterDate(related: string | Date, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAfterDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [related],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [related] = args.constraints;

          if (!value) return false;

          const valueDate = new Date(value);
          let compareDate: Date;

          if (typeof related === 'string') {
            const refValue = (args.object as any)[related];
            if (refValue !== undefined) {
              compareDate = new Date(refValue);
            } else {
              compareDate = new Date(related);
            }
          } else {
            compareDate = new Date(related);
          }

          return valueDate > compareDate;
        },

        defaultMessage(args: ValidationArguments) {
          const [related] = args.constraints;
          return typeof related === 'string' && (args.object as any)[related]
            ? `${args.property} must be after ${related}`
            : `${args.property} must be after ${new Date(related).toISOString()}`;
        },
      },
    });
  };
}
