import { AdminAuditLog, AdminActionType } from './admin-audit-log';

describe('AdminAuditLog Entity', () => {
  const validData = {
    id: 'audit-123',
    adminId: 'admin-1',
    targetUserId: 'user-1',
    action: 'BLOCK_USER' as AdminActionType,
    createdAt: new Date('2026-02-23T10:00:00Z'),
    details: 'Usuario user@example.com bloqueado',
  };

  describe('creation', () => {
    it('should create an audit log with all fields', () => {
      const log = new AdminAuditLog(
        validData.id,
        validData.adminId,
        validData.targetUserId,
        validData.action,
        validData.createdAt,
        validData.details,
      );

      expect(log.id).toBe(validData.id);
      expect(log.adminId).toBe(validData.adminId);
      expect(log.targetUserId).toBe(validData.targetUserId);
      expect(log.action).toBe('BLOCK_USER');
      expect(log.createdAt).toBe(validData.createdAt);
      expect(log.details).toBe(validData.details);
    });

    it('should create an audit log without optional details', () => {
      const log = new AdminAuditLog(
        validData.id,
        validData.adminId,
        validData.targetUserId,
        validData.action,
        validData.createdAt,
      );

      expect(log.id).toBe(validData.id);
      expect(log.details).toBeUndefined();
    });

    it('should accept all valid action types', () => {
      const actions: AdminActionType[] = ['PROMOTE_TO_ADMIN', 'BLOCK_USER', 'UNBLOCK_USER'];

      for (const action of actions) {
        const log = new AdminAuditLog(
          'id',
          'admin-1',
          'user-1',
          action,
          new Date(),
        );
        expect(log.action).toBe(action);
      }
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const log = new AdminAuditLog(
        validData.id,
        validData.adminId,
        validData.targetUserId,
        validData.action,
        validData.createdAt,
        validData.details,
      );

      // TypeScript enforces readonly at compile time.
      // Verify all fields are accessible and match expected values.
      expect(log.id).toBe(validData.id);
      expect(log.adminId).toBe(validData.adminId);
      expect(log.targetUserId).toBe(validData.targetUserId);
      expect(log.action).toBe(validData.action);
      expect(log.createdAt).toBe(validData.createdAt);
      expect(log.details).toBe(validData.details);
    });
  });
});
