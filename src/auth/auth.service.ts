import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { InvalidCredentialsError } from '../application/use-cases/login.use-case';
import { RegisterUserUseCase, UserRole, InvalidPasswordError, InvalidNameError, InvalidEmailError } from '../application/use-cases/register-user.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { EmailAlreadyExistsError } from '../application/use-cases/user-errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly jwtService: JwtService,
  ) { }

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

  async register(registerDto: RegisterDto) {
    try {
      // Map DTO role to use case role
      const roleMap: Record<string, UserRole> = {
        'cliente': UserRole.CLIENTE,
        'proprietario': UserRole.PROPRIETARIO,
      };

      const result = await this.registerUserUseCase.execute({
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password,
        role: roleMap[registerDto.role] || UserRole.CLIENTE,
      });

      return {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user
      };
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        throw new ConflictException('Email already exists');
      }
      if (error instanceof InvalidPasswordError || error instanceof InvalidNameError || error instanceof InvalidEmailError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async refreshToken(token: string) {
    try {
      const result = await this.refreshTokenUseCase.execute(token);
      return {
        access_token: result.accessToken,
        refresh_token: result.refreshToken
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.logoutUseCase.execute(userId);
    return { message: 'Logged out successfully' };
  }

  async validateToken(token: string): Promise<{ userId: string; email: string; role: string }> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'secret',
      });
      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
