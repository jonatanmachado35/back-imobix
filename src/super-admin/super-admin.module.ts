import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { ListTenantsUseCase } from '../application/use-cases/super-admin/list-tenants.use-case';
import { GetTenantUseCase } from '../application/use-cases/super-admin/get-tenant.use-case';
import { CreateTenantUseCase } from '../application/use-cases/super-admin/create-tenant.use-case';
import { UpdateTenantUseCase } from '../application/use-cases/super-admin/update-tenant.use-case';
import { SuspendTenantUseCase } from '../application/use-cases/super-admin/suspend-tenant.use-case';
import { ReactivateTenantUseCase } from '../application/use-cases/super-admin/reactivate-tenant.use-case';
import { DeleteTenantUseCase } from '../application/use-cases/super-admin/delete-tenant.use-case';
import { TenantRepository } from '../application/ports/tenant-repository';
import { SuperAdminAuditLogRepository } from '../application/ports/super-admin-audit-log-repository';
import { UserRepository } from '../application/ports/user-repository';
import { PasswordHasher } from '../application/ports/password-hasher';
import { PrismaTenantRepository } from '../infrastructure/database/prisma-tenant.repository';
import { PrismaSuperAdminAuditLogRepository } from '../infrastructure/database/prisma-super-admin-audit-log.repository';
import { UsersModule } from '../users/users.module';
import { USER_REPOSITORY, PASSWORD_HASHER } from '../users/users.tokens';

export const TENANT_REPOSITORY = 'TENANT_REPOSITORY';
export const SUPER_ADMIN_AUDIT_LOG_REPOSITORY = 'SUPER_ADMIN_AUDIT_LOG_REPOSITORY';

@Module({
  imports: [UsersModule],
  controllers: [SuperAdminController],
  providers: [
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository,
    },
    {
      provide: SUPER_ADMIN_AUDIT_LOG_REPOSITORY,
      useClass: PrismaSuperAdminAuditLogRepository,
    },
    {
      provide: ListTenantsUseCase,
      useFactory: (tenantRepo: TenantRepository) =>
        new ListTenantsUseCase(tenantRepo),
      inject: [TENANT_REPOSITORY],
    },
    {
      provide: GetTenantUseCase,
      useFactory: (tenantRepo: TenantRepository) =>
        new GetTenantUseCase(tenantRepo),
      inject: [TENANT_REPOSITORY],
    },
    {
      provide: CreateTenantUseCase,
      useFactory: (
        tenantRepo: TenantRepository,
        userRepo: UserRepository,
        hasher: PasswordHasher,
        auditLog: SuperAdminAuditLogRepository,
      ) => new CreateTenantUseCase(tenantRepo, userRepo, hasher, auditLog),
      inject: [TENANT_REPOSITORY, USER_REPOSITORY, PASSWORD_HASHER, SUPER_ADMIN_AUDIT_LOG_REPOSITORY],
    },
    {
      provide: UpdateTenantUseCase,
      useFactory: (
        tenantRepo: TenantRepository,
        auditLog: SuperAdminAuditLogRepository,
      ) => new UpdateTenantUseCase(tenantRepo, auditLog),
      inject: [TENANT_REPOSITORY, SUPER_ADMIN_AUDIT_LOG_REPOSITORY],
    },
    {
      provide: SuspendTenantUseCase,
      useFactory: (
        tenantRepo: TenantRepository,
        auditLog: SuperAdminAuditLogRepository,
      ) => new SuspendTenantUseCase(tenantRepo, auditLog),
      inject: [TENANT_REPOSITORY, SUPER_ADMIN_AUDIT_LOG_REPOSITORY],
    },
    {
      provide: ReactivateTenantUseCase,
      useFactory: (
        tenantRepo: TenantRepository,
        auditLog: SuperAdminAuditLogRepository,
      ) => new ReactivateTenantUseCase(tenantRepo, auditLog),
      inject: [TENANT_REPOSITORY, SUPER_ADMIN_AUDIT_LOG_REPOSITORY],
    },
    {
      provide: DeleteTenantUseCase,
      useFactory: (
        tenantRepo: TenantRepository,
        auditLog: SuperAdminAuditLogRepository,
      ) => new DeleteTenantUseCase(tenantRepo, auditLog),
      inject: [TENANT_REPOSITORY, SUPER_ADMIN_AUDIT_LOG_REPOSITORY],
    },
  ],
})
export class SuperAdminModule {}
