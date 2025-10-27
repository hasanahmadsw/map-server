/**
 * Enum for environment names
 */
export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export const ENV_FILES = {
  DEFAULT: '.env',
  DEVELOPMENT: '.env.development',
  PRODUCTION: '.env.production',
  TEST: '.env.test',

  getEnvFile: (env: string) => {
    const envFile = `.env.${env}`;
    // Check if the environment name exists in the keys of ENV_FILES
    if (!Object.values(ENV_FILES).includes(envFile) && envFile !== ENV_FILES.DEFAULT) {
      return null; // Return null if the environment file doesn't exist
    }
    return envFile;
  },
};

export const ENV_VALIDATION = {
  BOOLEAN_TRUTHY: ['true', 'yes', '1', 'on'],
  BOOLEAN_FALSY: ['false', 'no', '0', 'off'],
  MIN_JWT_LENGTH: 16,
  SMTP_PORTS: [25, 465, 587] as number[],
} as const;

export type BooleanTruthyValues = (typeof ENV_VALIDATION.BOOLEAN_TRUTHY)[number];
export type BooleanFalsyValues = (typeof ENV_VALIDATION.BOOLEAN_FALSY)[number];
