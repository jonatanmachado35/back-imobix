export interface CreateSuperAdminAuditLogData {
  adminId: string;
  acao: string;
  tenantId?: string | null;
  detalhes?: string | null;
}

export interface SuperAdminAuditLogRepository {
  create(data: CreateSuperAdminAuditLogData): Promise<void>;
}
