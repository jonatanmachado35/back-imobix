import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { JwtTokenGenerator } from '../infrastructure/security/jwt-token-generator.service';
import { UserRepository } from '../application/ports/user-repository';
import { PasswordHasher } from '../application/ports/password-hasher';
import { TokenGenerator } from '../application/ports/token-generator';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { USER_REPOSITORY } from '../users/users.tokens';
import { PASSWORD_HASHER } from '../users/users.tokens';
import { TOKEN_GENERATOR } from './auth.tokens';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any }
    })
  ],
  controllers: [AuthController],
  providers: [
    { provide: TOKEN_GENERATOR, useClass: JwtTokenGenerator },
    {
      provide: LoginUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
        tokenGenerator: TokenGenerator
      ) => new LoginUseCase(userRepository, passwordHasher, tokenGenerator),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, TOKEN_GENERATOR]
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
        tokenGenerator: TokenGenerator
      ) => new RegisterUserUseCase(userRepository, passwordHasher, tokenGenerator),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, TOKEN_GENERATOR]
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        userRepository: UserRepository,
        tokenGenerator: TokenGenerator
      ) => new RefreshTokenUseCase(userRepository, tokenGenerator),
      inject: [USER_REPOSITORY, TOKEN_GENERATOR]
    },
    {
      provide: LogoutUseCase,
      useFactory: (userRepository: UserRepository) => new LogoutUseCase(userRepository),
      inject: [USER_REPOSITORY]
    },
    AuthService,
    JwtStrategy,
    RolesGuard
  ],
  exports: [AuthService, TOKEN_GENERATOR]
})
export class AuthModule { }
