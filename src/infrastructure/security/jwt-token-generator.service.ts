import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenGenerator } from '../../application/ports/token-generator';

@Injectable()
export class JwtTokenGenerator implements TokenGenerator {
  constructor(private readonly jwtService: JwtService) {}

  generate(payload: { userId: string; email: string; role: string }): string {
    return this.jwtService.sign({
      sub: payload.userId,
      email: payload.email,
      role: payload.role
    });
  }
}
