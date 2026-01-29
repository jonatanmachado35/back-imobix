import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { InvalidCredentialsError } from '../application/use-cases/login.use-case';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase
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
}
