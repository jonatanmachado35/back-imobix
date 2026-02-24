export type AdminActionType = 'PROMOTE_TO_ADMIN' | 'BLOCK_USER' | 'UNBLOCK_USER';

export class AdminAuditLog {
  constructor(
    public readonly id: string,
    public readonly adminId: string,
    public readonly targetUserId: string,
    public readonly action: AdminActionType,
    public readonly createdAt: Date,
    public readonly details?: string | null,
  ) { }
}
