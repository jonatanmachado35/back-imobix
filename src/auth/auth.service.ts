import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { InvalidCredentialsError } from '../application/use-cases/login.use-case';
import { RegisterUserUseCase, UserRole, InvalidPasswordError, InvalidNameError, InvalidEmailError } from '../application/use-cases/register-user.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { EmailAlreadyExistsError, UserNotFoundError } from '../application/use-cases/user-errors';
import { ChangePasswordUseCase } from '../application/use-cases/password/change-password.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/password/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/password/reset-password.use-case';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { InvalidCurrentPasswordError, InvalidResetTokenError, PasswordsMatchError, WeakPasswordError } from '../application/use-cases/password/password-errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
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

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    try {
      await this.changePasswordUseCase.execute({
        userId,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
      });
    } catch (error) {
      if (error instanceof InvalidCurrentPasswordError) {
        throw new BadRequestException('Senha atual incorreta');
      }
      if (error instanceof WeakPasswordError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof PasswordsMatchError) {
        throw new BadRequestException('A nova senha deve ser diferente da atual');
      }
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('Usuário não encontrado');
      }
      throw error;
    }
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    try {
      const result = await this.requestPasswordResetUseCase.execute({
        email: dto.email,
      });

      return {
        resetToken: result.resetToken,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('Usuário não encontrado');
      }
      throw error;
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    try {
      await this.resetPasswordUseCase.execute({
        resetToken: dto.resetToken,
        newPassword: dto.newPassword,
      });
    } catch (error) {
      if (error instanceof InvalidResetTokenError) {
        throw new BadRequestException('Token inválido ou expirado');
      }
      if (error instanceof WeakPasswordError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
