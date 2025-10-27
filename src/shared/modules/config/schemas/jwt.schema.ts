import { z } from 'zod';

export const jwtSchema = z.object({
  // Access Token Configuration
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN_MS: z.coerce
    .number()
    .int()
    .positive('JWT_ACCESS_EXPIRES_IN_MS must be a positive number'),

  // Security Token Configuration
  JWT_SECURITY_SECRET: z.string().min(1, 'JWT_SECURITY_SECRET is required'),
  JWT_SECURITY_EXPIRES_IN_MS: z.coerce
    .number()
    .int()
    .positive('JWT_SECURITY_EXPIRES_IN_MS must be a positive number'),
});
