import {
  Plano,
  TenantDetailData,
  TenantRepository,
  UpdateTenantData,
} from '../../ports/tenant-repository';
import { SuperAdminAuditLogRepository } from '../../ports/super-admin-audit-log-repository';
import { TenantNotFoundError } from './super-admin-errors';

export type UpdateTenantInput = {
  superAdminId: string;
  tenantId: string;
  nome?: string;
  plano?: Plano;
};

export type UpdateTenantOutput = TenantDetailData;

export class UpdateTenantUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly auditLogRepository: SuperAdminAuditLogRepository,
  ) {}

  async execute(input: UpdateTenantInput): Promise<UpdateTenantOutput> {
    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError();
    }

    const data: UpdateTenantData = {};
    if (input.nome !== undefined) data.nome = input.nome;
    if (input.plano !== undefined) data.plano = input.plano;

    const updated = await this.tenantRepository.update(input.tenantId, data);

    await this.auditLogRepository.create({
      adminId: input.superAdminId,
      acao: 'UPDATE_TENANT',
      tenantId: input.tenantId,
      detalhes: `Tenant "${tenant.nome}" atualizado. Campos: ${JSON.stringify(data)}.`,
    });

    return updated;
  }
}
