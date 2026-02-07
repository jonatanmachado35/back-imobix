import { User } from '../../domain/entities/user';
import { PasswordHasher } from '../ports/password-hasher';
import { TokenGenerator } from '../ports/token-generator';
import { UserRepository } from '../ports/user-repository';
import { EmailAlreadyExistsError } from './user-errors';

export enum UserRole {
  CLIENTE = 'cliente',
  PROPRIETARIO = 'proprietario',
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterUserOutput {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

export class InvalidPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

export class InvalidNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNameError';
  }
}

export class InvalidEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailError';
  }
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator,
  ) { }

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // 1. Validate and sanitize input
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();

    if (!name || name.length === 0) {
      throw new InvalidNameError('Name is required');
    }

    if (!this.isValidEmail(email)) {
      throw new InvalidEmailError('Invalid email format');
    }

    if (!input.password || input.password.length < 8) {
      throw new InvalidPasswordError('Password must be at least 8 characters');
    }

    // 2. Check if email already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsError(email);
    }

    // 3. Hash password
    const passwordHash = await this.passwordHasher.hash(input.password);

    // 4. Map role to database role
    const dbRole = input.role === UserRole.PROPRIETARIO ? 'ADMIN' : 'USER';

    // 5. Create user
    const user = await this.userRepository.create({
      nome: name,
      email: email,
      passwordHash,
      role: dbRole,
      userRole: input.role,
    });

    // 6. Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: input.role,
    };

    const accessToken = this.tokenGenerator.generate(tokenPayload);
    const refreshToken = this.tokenGenerator.generateRefreshToken(tokenPayload);

    // 7. Store refresh token
    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: input.role,
      },
      accessToken,
      refreshToken,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
