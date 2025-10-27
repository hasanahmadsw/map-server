import { z } from 'zod';
import { environmentSchema } from './env.schema';

/**
 * Validates environment configuration
 */
export class EnvironmentValidator {
  static validate(config: Record<string, unknown>) {
    try {
      return environmentSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
        throw new Error(`Environment validation failed:\n${formattedErrors}`);
      }
      throw error;
    }
  }
}
