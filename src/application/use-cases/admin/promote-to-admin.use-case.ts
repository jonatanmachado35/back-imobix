import { UserRepository } from '../../ports/user-repository';
import { UserNotFoundError } from '../user-errors';
import {
  CannotPromoteBlockedUserError,
  UserAlreadyAdminError,
} from './admin-errors';

export type PromoteToAdminInput = {
  adminId: string;
  targetUserId: string;
};

export type PromoteToAdminOutput = {
  id: string;
  nome: string;
  email: string;
  role: string;
  message: string;
};

export class PromoteToAdminUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) { }

  async execute(input: PromoteToAdminInput): Promise<PromoteToAdminOutput> {
    const targetUser = await this.userRepository.findById(input.targetUserId);

    if (!targetUser) {
      throw new UserNotFoundError();
    }

    if (targetUser.isAdmin) {
      throw new UserAlreadyAdminError();
    }

    if (targetUser.isBlocked) {
      throw new CannotPromoteBlockedUserError();
    }

    const promotedUser = targetUser.promoteToAdmin();

    await this.userRepository.saveWithAuditLog(promotedUser, {
      adminId: input.adminId,
      targetUserId: input.targetUserId,
      action: 'PROMOTE_TO_ADMIN',
      details: `Usuario ${targetUser.email} promovido a admin`,
    });

    return {
      id: promotedUser.id,
      nome: promotedUser.nome,
      email: promotedUser.email,
      role: promotedUser.role,
      message: 'Usuario promovido a admin',
    };
  }
}
