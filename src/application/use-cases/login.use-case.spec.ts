import { User } from '../../domain/entities/user';
import { PasswordHasher } from '../ports/password-hasher';
import { TokenGenerator } from '../ports/token-generator';
import { CreateUserData, ListUsersFilters, ListUsersResult, UserRepository } from '../ports/user-repository';
import { UserBlockedError } from './admin/admin-errors';
import { InvalidCredentialsError, LoginUseCase } from './login.use-case';

class InMemoryUserRepository implements UserRepository {
  private items: User[] = [];
  private counter = 1;

  async findByEmail(email: string): Promise<User | null> {
    const found = this.items.find((item) => item.email === email);
    return found ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const found = this.items.find((item) => item.id === id);
    return found ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    const now = new Date();
    const user = new User(
      String(this.counter++),
      data.nome,
      data.email,
      data.passwordHash,
      'USER',
      now,
      now,
      null,
      null,
      null,
      null,
      null,
      null,
      'ACTIVE',
    );
    this.items.push(user);
    return user;
  }

  async update(id: string, data: any): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    // No-op for tests
  }

  async save(user: User): Promise<void> {
    const index = this.items.findIndex((item) => item.id === user.id);
    if (index >= 0) {
      this.items[index] = user;
      return;
    }
    this.items.push(user);
  }

  async findByResetToken(token: string): Promise<User | null> {
    const found = this.items.find((item) => item.resetPasswordToken === token);
    return found ?? null;
  }

  async findAll(filters: ListUsersFilters): Promise<ListUsersResult> {
    return { data: this.items, meta: { total: this.items.length, page: 1, limit: 20, totalPages: 1 } };
  }

  async saveWithAuditLog(user: User, _auditLogData: any, _options?: any): Promise<void> {
    await this.save(user);
  }

  // Helper for tests
  addUser(user: User): void {
    this.items.push(user);
  }
}

class FakeHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed-${plain}`;
  }
}

class FakeTokenGenerator implements TokenGenerator {
  generate(payload: { userId: string; email: string; role: string }): string {
    return `token-${payload.userId}-${payload.email}`;
  }

  generateRefreshToken(payload: { userId: string; email: string; role: string }): string {
    return `refresh-${payload.userId}`;
  }

  verifyRefreshToken(token: string): { userId: string; email: string; role: string } | null {
    if (token.startsWith('refresh-')) {
      const userId = token.replace('refresh-', '');
      return { userId, email: 'test@test.com', role: 'USER' };
    }
    return null;
  }
}

describe('LoginUseCase', () => {
  it('should authenticate user with valid credentials', async () => {
    const userRepository = new InMemoryUserRepository();
    const hasher = new FakeHasher();
    const tokenGenerator = new FakeTokenGenerator();
    const useCase = new LoginUseCase(userRepository, hasher, tokenGenerator);

    // Create a user first
    await userRepository.create({
      nome: 'João Silva',
      email: 'joao@example.com',
      passwordHash: 'hashed-password123'
    });

    const result = await useCase.execute({
      email: 'joao@example.com',
      password: 'password123'
    });

    expect(result.accessToken).toBe('token-1-joao@example.com');
    expect(result.user.email).toBe('joao@example.com');
    expect(result.user.nome).toBe('João Silva');
  });

  it('should reject invalid email', async () => {
    const userRepository = new InMemoryUserRepository();
    const hasher = new FakeHasher();
    const tokenGenerator = new FakeTokenGenerator();
    const useCase = new LoginUseCase(userRepository, hasher, tokenGenerator);

    await expect(
      useCase.execute({
        email: 'nonexistent@example.com',
        password: 'password123'
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('should reject invalid password', async () => {
    const userRepository = new InMemoryUserRepository();
    const hasher = new FakeHasher();
    const tokenGenerator = new FakeTokenGenerator();
    const useCase = new LoginUseCase(userRepository, hasher, tokenGenerator);

    await userRepository.create({
      nome: 'João Silva',
      email: 'joao@example.com',
      passwordHash: 'hashed-password123'
    });

    await expect(
      useCase.execute({
        email: 'joao@example.com',
        password: 'wrongpassword'
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('should not expose password hash in response', async () => {
    const userRepository = new InMemoryUserRepository();
    const hasher = new FakeHasher();
    const tokenGenerator = new FakeTokenGenerator();
    const useCase = new LoginUseCase(userRepository, hasher, tokenGenerator);

    await userRepository.create({
      nome: 'João Silva',
      email: 'joao@example.com',
      passwordHash: 'hashed-password123'
    });

    const result = await useCase.execute({
      email: 'joao@example.com',
      password: 'password123'
    });

    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('should reject login when user is blocked', async () => {
    const userRepository = new InMemoryUserRepository();
    const hasher = new FakeHasher();
    const tokenGenerator = new FakeTokenGenerator();
    const useCase = new LoginUseCase(userRepository, hasher, tokenGenerator);

    // Create a blocked user directly
    const blockedUser = new User(
      'blocked-1',
      'Maria Bloqueada',
      'maria@example.com',
      'hashed-password123',
      'USER',
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      null,
      null,
      'BLOCKED',
    );
    userRepository.addUser(blockedUser);

    await expect(
      useCase.execute({
        email: 'maria@example.com',
        password: 'password123'
      })
    ).rejects.toBeInstanceOf(UserBlockedError);
  });
});
