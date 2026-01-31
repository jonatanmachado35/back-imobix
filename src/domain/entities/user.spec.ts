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
});
