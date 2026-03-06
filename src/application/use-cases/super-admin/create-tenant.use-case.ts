import {
  CreateTenantData,
  Plano,
  TenantDetailData,
  TenantRepository,
} from '../../ports/tenant-repository';
import { PasswordHasher } from '../../ports/password-hasher';
import { SuperAdminAuditLogRepository } from '../../ports/super-admin-audit-log-repository';
import { UserRepository } from '../../ports/user-repository';
import { AdminEmailAlreadyExistsError } from './super-admin-errors';

export type CreateTenantInput = {
  /** Super Admin que está executando a ação */
  superAdminId: string;
  nome: string;
  plano: Plano;
  adminNome: string;
  adminEmail: string;
  adminPassword: string;
};

export type CreateTenantOutput = TenantDetailData;

export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditLogRepository: SuperAdminAuditLogRepository,
  ) {}

  async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
    // Verificar se o email do admin já existe
    const existingUser = await this.userRepository.findByEmail(input.adminEmail);
    if (existingUser) {
      throw new AdminEmailAlreadyExistsError();
    }

    const adminPasswordHash = await this.passwordHasher.hash(input.adminPassword);

    const data: CreateTenantData = {
      nome: input.nome,
      plano: input.plano,
      adminNome: input.adminNome,
      adminEmail: input.adminEmail,
      adminPasswordHash,
    };

    const tenant = await this.tenantRepository.create(data);

    // Registrar na trilha de auditoria (ADR-002)
    await this.auditLogRepository.create({
      adminId: input.superAdminId,
      acao: 'CREATE_TENANT',
      tenantId: tenant.id,
      detalhes: `Tenant "${tenant.nome}" criado. Admin: ${input.adminEmail}. Plano: ${input.plano}.`,
    });

    return tenant;
  }
}
