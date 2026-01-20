import { User } from '../../domain/entities/user';
import { PasswordHasher } from '../ports/password-hasher';
import { CreateUserData, UserRepository } from '../ports/user-repository';

export class EmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Email already exists: ${email}`);
  }
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher
  ) { }

  async execute(input: CreateUserInput): Promise<User> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyExistsError(input.email);
    }

    const passwordHash = await this.hasher.hash(input.password);

    const data: CreateUserData = {
      nome: input.name,
      email: input.email,
      passwordHash
    };

    return this.users.create(data);
  }
}
