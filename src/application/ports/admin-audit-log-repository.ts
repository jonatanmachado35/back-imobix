import { AdminActionType, AdminAuditLog } from '../../domain/entities/admin-audit-log';

export type CreateAuditLogData = {
  adminId: string;
  targetUserId: string;
  action: AdminActionType;
  details?: string;
};

export interface AdminAuditLogRepository {
  create(data: CreateAuditLogData): Promise<AdminAuditLog>;
}
