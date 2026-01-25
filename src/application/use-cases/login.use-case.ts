import { User } from '../../domain/entities/user';
import { PasswordHasher } from '../ports/password-hasher';
import { TokenGenerator } from '../ports/token-generator';
import { UserRepository } from '../ports/user-repository';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginOutput = {
  accessToken: string;
  user: {
    id: string;
    nome: string;
    email: string;
    role: string;
  };
};

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokenGenerator.generate({
      userId: user.id,
      email: user.email,
      role: 'USER' // This should come from user entity when role is added
    });

    return {
      accessToken,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: 'USER'
      }
    };
  }

  private async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return this.passwordHasher.compare(plainPassword, hashedPassword);
  }
}
