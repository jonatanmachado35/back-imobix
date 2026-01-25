import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { InvalidCredentialsError } from '../application/use-cases/login.use-case';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly prisma: PrismaService
  ) {}

  async login(loginDto: LoginDto) {
    try {
      const result = await this.loginUseCase.execute({
        email: loginDto.email,
        password: loginDto.password
      });

      return {
        access_token: result.accessToken,
        user: result.user
      };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException('Invalid credentials');
      }
      throw error;
    }
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
