import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchFields', async: false })
export class MatchFieldsConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [field1, field2] = args.constraints;
    const object = args.object as any;
    return object[field1] === object[field2];
  }

  defaultMessage(args: ValidationArguments) {
    const [field1, field2] = args.constraints;
    return `${field1} and ${field2} must match`;
  }
}

export function MatchFields(fields: [string, string], validationOptions?: ValidationOptions) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    registerDecorator({
      name: 'matchFields',
      target: constructor,
      propertyName: fields[1], // Register on the second field
      constraints: fields,
      options: validationOptions,
      validator: MatchFieldsConstraint,
    });
    return constructor;
  };
}
