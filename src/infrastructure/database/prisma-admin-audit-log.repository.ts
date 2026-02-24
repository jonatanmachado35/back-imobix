import { Injectable } from '@nestjs/common';
import { AdminAuditLogRepository, CreateAuditLogData } from '../../application/ports/admin-audit-log-repository';
import { AdminAuditLog } from '../../domain/entities/admin-audit-log';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaAdminAuditLogRepository implements AdminAuditLogRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateAuditLogData): Promise<AdminAuditLog> {
    const record = await this.prisma.adminAuditLog.create({
      data: {
        adminId: data.adminId,
        targetUserId: data.targetUserId,
        action: data.action as any,
        details: data.details,
      },
    });

    return new AdminAuditLog(
      record.id,
      record.adminId,
      record.targetUserId,
      record.action as any,
      record.createdAt,
      record.details,
    );
  }
}
