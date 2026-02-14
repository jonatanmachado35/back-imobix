import { Module } from '@nestjs/common';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { GetUserProfileUseCase } from '../application/use-cases/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '../application/use-cases/update-user-profile.use-case';
import { UploadUserAvatarUseCase } from '../application/use-cases/user-avatar/upload-user-avatar.use-case';
import { DeleteUserAvatarUseCase } from '../application/use-cases/user-avatar/delete-user-avatar.use-case';
import { PasswordHasher } from '../application/ports/password-hasher';
import { UserRepository } from '../application/ports/user-repository';
import { IFileStorageService } from '../application/ports/file-storage.interface';
import { PrismaUserRepository } from '../infrastructure/database/prisma-user.repository';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { BcryptHasher } from '../infrastructure/security/bcrypt-hasher.service';
import { CloudinaryModule } from '../infrastructure/file-storage/cloudinary/cloudinary.module';
import { UsersController } from '../interfaces/http/users.controller';
import { UserAvatarController } from '../interfaces/http/user-avatar.controller';
import { PASSWORD_HASHER, USER_REPOSITORY } from './users.tokens';

@Module({
  imports: [CloudinaryModule],
  controllers: [UsersController, UserAvatarController],
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
    },
    {
      provide: UploadUserAvatarUseCase,
      useFactory: (users: UserRepository, fileStorage: IFileStorageService) =>
        new UploadUserAvatarUseCase(users, fileStorage),
      inject: [USER_REPOSITORY, IFileStorageService]
    },
    {
      provide: DeleteUserAvatarUseCase,
      useFactory: (users: UserRepository, fileStorage: IFileStorageService) =>
        new DeleteUserAvatarUseCase(users, fileStorage),
      inject: [USER_REPOSITORY, IFileStorageService]
    }
  ],
  exports: [USER_REPOSITORY, PASSWORD_HASHER]
})
export class UsersModule { }
