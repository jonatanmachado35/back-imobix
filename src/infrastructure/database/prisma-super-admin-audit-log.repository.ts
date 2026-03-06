import { Injectable } from '@nestjs/common';
import { CreateSuperAdminAuditLogData, SuperAdminAuditLogRepository } from '../../application/ports/super-admin-audit-log-repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaSuperAdminAuditLogRepository implements SuperAdminAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSuperAdminAuditLogData): Promise<void> {
    await (this.prisma as any).superAdminAuditLog.create({
      data: {
        adminId: data.adminId,
        acao: data.acao,
        tenantId: data.tenantId ?? null,
        detalhes: data.detalhes ?? null,
      },
    });
  }
}
