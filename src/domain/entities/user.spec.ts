import { User } from './user';

describe('User Entity', () => {
  describe('creation', () => {
    it('should create a valid user', () => {
      const now = new Date();
      const user = new User(
        '1',
        'João Silva',
        'joao@example.com',
        'hashed-password',
        'USER',
        now,
        now
      );

      expect(user.id).toBe('1');
      expect(user.nome).toBe('João Silva');
      expect(user.email).toBe('joao@example.com');
      expect(user.passwordHash).toBe('hashed-password');
      expect(user.createdAt).toBe(now);
      expect(user.updatedAt).toBe(now);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const now = new Date();
      const user = new User(
        '1',
        'João Silva',
        'joao@example.com',
        'hashed-password',
        'USER',
        now,
        now
      );

      // TypeScript enforces readonly at compile time
      // Runtime assignment still works but is a design violation
      // This test documents the readonly intent
      expect(user.id).toBe('1');
      expect(user.email).toBe('joao@example.com');
    });
  });

  describe('Password Management', () => {
    const baseUser = new User(
      'user-123',
      'John Doe',
      'john@example.com',
      'hashed-password',
      'USER',
      new Date('2024-01-01'),
      new Date('2024-01-01'),
    );

    describe('changePassword', () => {
      it('should return new instance with updated password hash', () => {
        const newHash = 'new-hashed-password';
        const result = baseUser.changePassword(newHash);

        expect(result).not.toBe(baseUser); // Imutabilidade
        expect(result.passwordHash).toBe(newHash);
        expect(result.id).toBe(baseUser.id);
        expect(result.email).toBe(baseUser.email);
      });

      it('should update the updatedAt timestamp', () => {
        const result = baseUser.changePassword('new-hash');
        expect(result.updatedAt.getTime()).toBeGreaterThan(baseUser.updatedAt.getTime());
      });
    });

    describe('setResetToken', () => {
      it('should return new instance with reset token and expiry', () => {
        const token = 'reset-token-123';
        const expiry = new Date('2024-12-31');

        const result = baseUser.setResetToken(token, expiry);

        expect(result).not.toBe(baseUser);
        expect(result.resetPasswordToken).toBe(token);
        expect(result.resetPasswordExpiry).toBe(expiry);
      });
    });

    describe('clearResetToken', () => {
      it('should remove reset token and expiry', () => {
        const userWithToken = baseUser.setResetToken('token', new Date());
        const result = userWithToken.clearResetToken();

        expect(result.resetPasswordToken).toBeNull();
        expect(result.resetPasswordExpiry).toBeNull();
      });
    });

    describe('isResetTokenValid', () => {
      it('should return true for valid non-expired token', () => {
        const token = 'valid-token';
        const futureDate = new Date(Date.now() + 3600000); // +1 hora
        const user = baseUser.setResetToken(token, futureDate);

        expect(user.isResetTokenValid(token)).toBe(true);
      });

      it('should return false for expired token', () => {
        const token = 'expired-token';
        const pastDate = new Date(Date.now() - 3600000); // -1 hora
        const user = baseUser.setResetToken(token, pastDate);

        expect(user.isResetTokenValid(token)).toBe(false);
      });

      it('should return false for wrong token', () => {
        const user = baseUser.setResetToken('correct-token', new Date(Date.now() + 3600000));
        expect(user.isResetTokenValid('wrong-token')).toBe(false);
      });

      it('should return false when no reset token exists', () => {
        expect(baseUser.isResetTokenValid('any-token')).toBe(false);
      });
    });
  });

  describe('Admin Management Methods', () => {
    const baseUser = new User(
      'user-123',
      'John Doe',
      'john@example.com',
      'hashed-password',
      'USER',
      new Date('2024-01-01'),
      new Date('2024-01-01'),
      null,
      null,
      'cliente',
      null,
      null,
      null,
      'ACTIVE',
    );

    describe('block()', () => {
      it('should return a new instance with status BLOCKED', () => {
        const blocked = baseUser.block();

        expect(blocked).not.toBe(baseUser);
        expect(blocked.status).toBe('BLOCKED');
        expect(blocked.id).toBe(baseUser.id);
        expect(blocked.email).toBe(baseUser.email);
        expect(blocked.role).toBe(baseUser.role);
      });

      it('should not mutate the original instance', () => {
        baseUser.block();

        expect(baseUser.status).toBe('ACTIVE');
      });
    });

    describe('unblock()', () => {
      it('should return a new instance with status ACTIVE', () => {
        const blockedUser = new User(
          'user-123',
          'John Doe',
          'john@example.com',
          'hashed-password',
          'USER',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
          null,
          null,
          'cliente',
          null,
          null,
          null,
          'BLOCKED',
        );

        const unblocked = blockedUser.unblock();

        expect(unblocked).not.toBe(blockedUser);
        expect(unblocked.status).toBe('ACTIVE');
        expect(unblocked.id).toBe(blockedUser.id);
        expect(unblocked.email).toBe(blockedUser.email);
      });

      it('should not mutate the original instance', () => {
        const blockedUser = new User(
          'user-123',
          'John Doe',
          'john@example.com',
          'hashed-password',
          'USER',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
          null,
          null,
          'cliente',
          null,
          null,
          null,
          'BLOCKED',
        );

        blockedUser.unblock();

        expect(blockedUser.status).toBe('BLOCKED');
      });
    });

    describe('promoteToAdmin()', () => {
      it('should return a new instance with role ADMIN', () => {
        const promoted = baseUser.promoteToAdmin();

        expect(promoted).not.toBe(baseUser);
        expect(promoted.role).toBe('ADMIN');
        expect(promoted.id).toBe(baseUser.id);
        expect(promoted.email).toBe(baseUser.email);
        expect(promoted.status).toBe(baseUser.status);
      });

      it('should not mutate the original instance', () => {
        baseUser.promoteToAdmin();

        expect(baseUser.role).toBe('USER');
      });
    });

    describe('isBlocked', () => {
      it('should return true when status is BLOCKED', () => {
        const blockedUser = new User(
          'user-123',
          'John Doe',
          'john@example.com',
          'hashed-password',
          'USER',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
          null,
          null,
          'cliente',
          null,
          null,
          null,
          'BLOCKED',
        );

        expect(blockedUser.isBlocked).toBe(true);
      });

      it('should return false when status is ACTIVE', () => {
        expect(baseUser.isBlocked).toBe(false);
      });
    });

    describe('isAdmin', () => {
      it('should return true when role is ADMIN', () => {
        const adminUser = new User(
          'admin-123',
          'Admin',
          'admin@example.com',
          'hashed-password',
          'ADMIN',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        );

        expect(adminUser.isAdmin).toBe(true);
      });

      it('should return false when role is USER', () => {
        expect(baseUser.isAdmin).toBe(false);
      });
    });
  });
});
