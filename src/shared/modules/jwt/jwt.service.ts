import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { EnvironmentConfig } from '../config/env.schema';
import {
  AccessTokenPayload,
  DecodedAccessTokenPayload,
  DecodedSecurityTokenPayload,
  SecurityTokenPayload,
} from './interfaces';

/**
 * Service for handling JWT operations including token creation, verification and management
 */
@Injectable()
export class AppJwtService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: number;
  private readonly securitySecret: string;
  private readonly securityExpiresIn: number;

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    this.accessSecret = this.configService.getOrThrow('JWT_ACCESS_SECRET');
    this.accessExpiresIn = this.configService.getOrThrow<number>('JWT_ACCESS_EXPIRES_IN_MS');

    this.securitySecret = this.configService.getOrThrow('JWT_SECURITY_SECRET');
    this.securityExpiresIn = this.configService.getOrThrow<number>('JWT_SECURITY_EXPIRES_IN_MS');
  }

  /**
   * Creates an access token for user authentication
   * @param payload User information to include in token
   * @returns Signed JWT access token
   */
  createAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: this.accessExpiresIn });
  }

  /**
   * Creates a security token for operations like email verification or password reset
   * @param payload Security information including email, code and operation type
   * @returns Signed JWT security token
   */
  createSecurityToken(payload: SecurityTokenPayload): string {
    return jwt.sign(payload, this.securitySecret, { expiresIn: this.securityExpiresIn });
  }

  /**
   * Verifies an access token's validity
   * @param token Access token to verify
   * @param ignoreExpiration Whether to ignore token expiration
   * @returns Decoded token payload if valid
   * @throws UnauthorizedException if token is invalid
   */
  verifyAccessToken(token: string, ignoreExpiration = false): DecodedAccessTokenPayload {
    try {
      return jwt.verify(token, this.accessSecret, {
        ignoreExpiration,
      }) as DecodedAccessTokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError' && ignoreExpiration) {
        const decoded = jwt.decode(token);
        if (decoded) {
          return decoded as DecodedAccessTokenPayload;
        }
      }
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Verifies a security token's validity
   * @param token Security token to verify
   * @param ignoreExpiration Whether to ignore token expiration
   * @returns Decoded token payload if valid
   * @throws UnauthorizedException if token is invalid
   */
  verifySecurityToken(token: string, ignoreExpiration = false): DecodedSecurityTokenPayload {
    try {
      return jwt.verify(token, this.securitySecret, {
        ignoreExpiration,
      }) as DecodedSecurityTokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError' && ignoreExpiration) {
        const decoded = jwt.decode(token);
        if (decoded) {
          return decoded as DecodedSecurityTokenPayload;
        }
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
