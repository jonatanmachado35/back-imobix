import { User } from '../../domain/entities/user';
import { PasswordHasher } from '../ports/password-hasher';
import { TokenGenerator } from '../ports/token-generator';
import { CreateUserData, UserRepository } from '../ports/user-repository';
import { InvalidCredentialsError, LoginUseCase } from './login.use-case';

class InMemoryUserRepository implements UserRepository {
  private items: User[] = [];
  private counter = 1;

  async findByEmail(email: string): Promise<User | null> {
    const found = this.items.find((item) => item.email === email);
    return found ?? null;
  }

  async create(data: CreateUserData): Promise<User> {
    const now = new Date();
    const user = new User(
      String(this.counter++),
      data.nome,
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

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed-${plain}`;
  }
}

class FakeTokenGenerator implements TokenGenerator {
  generate(payload: { userId: string; email: string; role: string }): string {
    return `token-${payload.userId}-${payload.email}`;
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
});
