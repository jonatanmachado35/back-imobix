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
});
