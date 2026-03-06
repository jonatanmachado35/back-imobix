import { UserRepository } from '../../ports/user-repository';
import { UserNotFoundError } from '../user-errors';
import { TenantMismatchError, UserNotBlockedError } from './admin-errors';

export type UnblockUserInput = {
  adminId: string;
  targetUserId: string;
  /** tenantId do admin autenticado — null apenas para SUPER_ADMIN (ADR-001) */
  tenantId?: string | null;
};

export type UnblockUserOutput = {
  id: string;
  nome: string;
  email: string;
  status: string;
  message: string;
};

export class UnblockUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) { }

  async execute(input: UnblockUserInput): Promise<UnblockUserOutput> {
    const targetUser = await this.userRepository.findById(input.targetUserId);

    if (!targetUser) {
      throw new UserNotFoundError();
    }

    // Isolamento por tenant: ADMIN só desbloqueia usuários do próprio tenant (ADR-001)
    if (input.tenantId && targetUser.tenantId !== input.tenantId) {
      throw new TenantMismatchError();
    }

    if (!targetUser.isBlocked) {
      throw new UserNotBlockedError();
    }

    const unblockedUser = targetUser.unblock();

    await this.userRepository.saveWithAuditLog(unblockedUser, {
      adminId: input.adminId,
      targetUserId: input.targetUserId,
      action: 'UNBLOCK_USER',
      details: `Usuario ${targetUser.email} desbloqueado`,
    });

    return {
      id: unblockedUser.id,
      nome: unblockedUser.nome,
      email: unblockedUser.email,
      status: 'active',
      message: 'Usuario desbloqueado',
    };
  }
}
