import { Module } from '@nestjs/common';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { GetUserProfileUseCase } from '../application/use-cases/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '../application/use-cases/update-user-profile.use-case';
import { PasswordHasher } from '../application/ports/password-hasher';
import { UserRepository } from '../application/ports/user-repository';
import { PrismaUserRepository } from '../infrastructure/database/prisma-user.repository';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { BcryptHasher } from '../infrastructure/security/bcrypt-hasher.service';
import { UsersController } from '../interfaces/http/users.controller';
import { PASSWORD_HASHER, USER_REPOSITORY } from './users.tokens';

@Module({
  controllers: [UsersController],
  providers: [
    PrismaService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptHasher },
    {
      provide: CreateUserUseCase,
      useFactory: (users: UserRepository, hasher: PasswordHasher) =>
        new CreateUserUseCase(users, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER]
    },
    {
      provide: GetUserProfileUseCase,
      useFactory: (users: UserRepository) => new GetUserProfileUseCase(users),
      inject: [USER_REPOSITORY]
    },
    {
      provide: UpdateUserProfileUseCase,
      useFactory: (users: UserRepository) => new UpdateUserProfileUseCase(users),
      inject: [USER_REPOSITORY]
    }
  ],
  exports: [USER_REPOSITORY, PASSWORD_HASHER]
})
export class UsersModule { }
