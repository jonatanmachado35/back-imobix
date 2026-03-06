import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenGenerator, TokenPayload } from '../../application/ports/token-generator';

@Injectable()
export class JwtTokenGenerator implements TokenGenerator {
  constructor(private readonly jwtService: JwtService) { }

  generate(payload: TokenPayload): string {
    return this.jwtService.sign({
      sub: payload.userId,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(
      {
        sub: payload.userId,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId ?? null,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );
  }

  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const decoded = this.jwtService.verify(token);
      if (decoded.type !== 'refresh') {
        return null;
      }
      return {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId ?? null,
      };
    } catch {
      return null;
    }
  }
}
