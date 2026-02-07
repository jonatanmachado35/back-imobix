import { User } from '../../domain/entities/user';
import { PasswordHasher } from '../ports/password-hasher';
import { UserRepository } from '../ports/user-repository';
import { CreateUserUseCase } from './create-user.use-case';
import { EmailAlreadyExistsError } from './user-errors';

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

  async create(data: { nome: string; email: string; passwordHash: string }): Promise<User> {
    const now = new Date();
    const user = new User(
      String(this.counter++),
      data.nome,
      data.email,
      data.passwordHash,
      'USER',
      now,
      now
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
}

class FakeHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed-${plain}`;
  }
}

describe('CreateUserUseCase', () => {
  it('creates a user with hashed password', async () => {
    const users = new InMemoryUserRepository();
    const hasher = new FakeHasher();
    const useCase = new CreateUserUseCase(users, hasher);

    const user = await useCase.execute({
      nome: 'Ana',
      email: 'ana@example.com',
      password: 'password123'
    });

    expect(user.email).toBe('ana@example.com');
    expect(user.passwordHash).toBe('hashed-password123');
  });

  it('rejects duplicate emails', async () => {
    const users = new InMemoryUserRepository();
    const hasher = new FakeHasher();
    const useCase = new CreateUserUseCase(users, hasher);

    await useCase.execute({
      nome: 'Ana',
      email: 'ana@example.com',
      password: 'password123'
    });

    await expect(
      useCase.execute({
        nome: 'Ana 2',
        email: 'ana@example.com',
        password: 'password123'
      })
    ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
  });
});
