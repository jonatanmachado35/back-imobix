import { UserRepository } from '../../ports/user-repository';
import { UserNotFoundError } from '../user-errors';
import {
  CannotBlockAdminError,
  UserAlreadyBlockedError,
} from './admin-errors';

export type BlockUserInput = {
  adminId: string;
  targetUserId: string;
};

export type BlockUserOutput = {
  id: string;
  nome: string;
  email: string;
  status: string;
  message: string;
};

export class BlockUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) { }

  async execute(input: BlockUserInput): Promise<BlockUserOutput> {
    const targetUser = await this.userRepository.findById(input.targetUserId);

    if (!targetUser) {
      throw new UserNotFoundError();
    }

    if (targetUser.isAdmin) {
      throw new CannotBlockAdminError();
    }

    if (targetUser.isBlocked) {
      throw new UserAlreadyBlockedError();
    }

    const blockedUser = targetUser.block();

    // Save user, invalidate refresh token, and create audit log in a single transaction (Nota 5 + RN-02)
    await this.userRepository.saveWithAuditLog(
      blockedUser,
      {
        adminId: input.adminId,
        targetUserId: input.targetUserId,
        action: 'BLOCK_USER',
        details: `Usuario ${targetUser.email} bloqueado`,
      },
      { invalidateRefreshToken: true },
    );

    return {
      id: blockedUser.id,
      nome: blockedUser.nome,
      email: blockedUser.email,
      status: 'blocked',
      message: 'Usuario bloqueado',
    };
  }
}
