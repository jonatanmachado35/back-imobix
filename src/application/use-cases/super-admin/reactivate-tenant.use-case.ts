import { TenantRepository } from '../../ports/tenant-repository';
import { SuperAdminAuditLogRepository } from '../../ports/super-admin-audit-log-repository';
import {
  TenantNotFoundError,
  TenantNotSuspendedError,
} from './super-admin-errors';

export type ReactivateTenantInput = {
  superAdminId: string;
  tenantId: string;
};

export class ReactivateTenantUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly auditLogRepository: SuperAdminAuditLogRepository,
  ) {}

  async execute(input: ReactivateTenantInput): Promise<void> {
    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError();
    }

    if (tenant.status !== 'SUSPENSO') {
      throw new TenantNotSuspendedError();
    }

    await this.tenantRepository.reactivate(input.tenantId);

    await this.auditLogRepository.create({
      adminId: input.superAdminId,
      acao: 'REACTIVATE_TENANT',
      tenantId: input.tenantId,
      detalhes: `Tenant "${tenant.nome}" reativado.`,
    });
  }
}
