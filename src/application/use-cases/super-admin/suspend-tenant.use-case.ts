import { TenantRepository } from '../../ports/tenant-repository';
import { SuperAdminAuditLogRepository } from '../../ports/super-admin-audit-log-repository';
import {
  TenantNotFoundError,
  TenantAlreadySuspendedError,
} from './super-admin-errors';

export type SuspendTenantInput = {
  superAdminId: string;
  tenantId: string;
  motivo?: string;
};

export class SuspendTenantUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly auditLogRepository: SuperAdminAuditLogRepository,
  ) {}

  async execute(input: SuspendTenantInput): Promise<void> {
    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError();
    }

    if (tenant.status === 'SUSPENSO') {
      throw new TenantAlreadySuspendedError();
    }

    // Suspende tenant e invalida refresh tokens de todos os usuários (ADR-001)
    await this.tenantRepository.suspend(input.tenantId);

    await this.auditLogRepository.create({
      adminId: input.superAdminId,
      acao: 'SUSPEND_TENANT',
      tenantId: input.tenantId,
      detalhes: `Tenant "${tenant.nome}" suspenso.${input.motivo ? ' Motivo: ' + input.motivo : ''}`,
    });
  }
}
