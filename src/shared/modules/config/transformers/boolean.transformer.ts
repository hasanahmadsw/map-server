import { BooleanTruthyValues, BooleanFalsyValues, ENV_VALIDATION } from '../env.constant';

export const booleanTransformer = (val: string): boolean => {
  const normalized = val.toLowerCase().trim() as BooleanTruthyValues | BooleanFalsyValues;

  if (ENV_VALIDATION.BOOLEAN_TRUTHY.includes(normalized as BooleanTruthyValues)) {
    return true;
  }

  if (ENV_VALIDATION.BOOLEAN_FALSY.includes(normalized as BooleanFalsyValues)) {
    return false;
  }

  throw new Error(
    `Invalid boolean value: "${val}". Expected one of: ${[
      ...ENV_VALIDATION.BOOLEAN_TRUTHY,
      ...ENV_VALIDATION.BOOLEAN_FALSY,
    ].join(', ')}`,
  );
};
