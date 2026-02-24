import { Module } from '@nestjs/common';
import { AdminController } from '../interfaces/http/admin.controller';
import { ListUsersUseCase } from '../application/use-cases/admin/list-users.use-case';
import { PromoteToAdminUseCase } from '../application/use-cases/admin/promote-to-admin.use-case';
import { BlockUserUseCase } from '../application/use-cases/admin/block-user.use-case';
import { UnblockUserUseCase } from '../application/use-cases/admin/unblock-user.use-case';
import { UserRepository } from '../application/ports/user-repository';
import { UsersModule } from '../users/users.module';
import { USER_REPOSITORY } from '../users/users.tokens';

@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [
    {
      provide: ListUsersUseCase,
      useFactory: (userRepository: UserRepository) =>
        new ListUsersUseCase(userRepository),
      inject: [USER_REPOSITORY],
    },
    {
      provide: PromoteToAdminUseCase,
      useFactory: (userRepository: UserRepository) =>
        new PromoteToAdminUseCase(userRepository),
      inject: [USER_REPOSITORY],
    },
    {
      provide: BlockUserUseCase,
      useFactory: (userRepository: UserRepository) =>
        new BlockUserUseCase(userRepository),
      inject: [USER_REPOSITORY],
    },
    {
      provide: UnblockUserUseCase,
      useFactory: (userRepository: UserRepository) =>
        new UnblockUserUseCase(userRepository),
      inject: [USER_REPOSITORY],
    },
  ],
})
export class AdminModule { }
