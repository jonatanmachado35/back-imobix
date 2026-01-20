import { User } from '../../domain/entities/user';
import { PasswordHasher } from '../ports/password-hasher';
import { UserRepository } from '../ports/user-repository';
import {
  CreateUserUseCase,
  EmailAlreadyExistsError
} from './create-user.use-case';

class InMemoryUserRepository implements UserRepository {
  private items: User[] = [];
  private counter = 1;

  async findByEmail(email: string): Promise<User | null> {
    const found = this.items.find((item) => item.email === email);
    return found ?? null;
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const now = new Date();
    const user = new User(
      String(this.counter++),
      data.name,
      data.email,
      data.passwordHash,
      now,
      now
    );
    this.items.push(user);
    return user;
  }
}

class FakeHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`;
  }
}

describe('CreateUserUseCase', () => {
  it('creates a user with hashed password', async () => {
    const users = new InMemoryUserRepository();
    const hasher = new FakeHasher();
    const useCase = new CreateUserUseCase(users, hasher);

    const user = await useCase.execute({
      name: 'Ana',
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
      name: 'Ana',
      email: 'ana@example.com',
      password: 'password123'
    });

    await expect(
      useCase.execute({
        name: 'Ana 2',
        email: 'ana@example.com',
        password: 'password123'
      })
    ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
  });
});
