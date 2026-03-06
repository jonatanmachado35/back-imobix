import { TenantRepository } from '../../ports/tenant-repository';
import { SuperAdminAuditLogRepository } from '../../ports/super-admin-audit-log-repository';
import {
  TenantNotFoundError,
  TenantAlreadyRemovedError,
} from './super-admin-errors';

export type DeleteTenantInput = {
  superAdminId: string;
  tenantId: string;
  motivo?: string;
};

export class DeleteTenantUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly auditLogRepository: SuperAdminAuditLogRepository,
  ) {}

  async execute(input: DeleteTenantInput): Promise<void> {
    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError();
    }

    if (tenant.status === 'REMOVIDO') {
      throw new TenantAlreadyRemovedError();
    }

    // Soft-delete: status = REMOVIDO (ADR: hard-delete vs soft-delete → soft-delete por padrão)
    await this.tenantRepository.softDelete(input.tenantId);

    await this.auditLogRepository.create({
      adminId: input.superAdminId,
      acao: 'DELETE_TENANT',
      tenantId: input.tenantId,
      detalhes: `Tenant "${tenant.nome}" removido (soft-delete).${input.motivo ? ' Motivo: ' + input.motivo : ''}`,
    });
  }
}
