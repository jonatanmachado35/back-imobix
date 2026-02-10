import { User } from '../../domain/entities/user';
import { PasswordHasher } from '../ports/password-hasher';
import { CreateUserData, UserRepository } from '../ports/user-repository';
import { EmailAlreadyExistsError } from './user-errors';

export type CreateUserInput = {
  nome: string;
  email: string;
  password: string;
  userRole?: string;
};

export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher
  ) { }

  async execute(input: CreateUserInput): Promise<User> {
    // Removed early check for existing user to avoid race conditions
    // Database unique constraint will catch duplicates reliably

    const passwordHash = await this.hasher.hash(input.password);

    const data: CreateUserData = {
      nome: input.nome,
      email: input.email,
      passwordHash,
      userRole: input.userRole || 'cliente'
    };

    try {
      return await this.users.create(data);
    } catch (error) {
      // If repository throws EmailAlreadyExistsError (from database constraint),
      // re-throw it so the controller can handle it
      if (error instanceof EmailAlreadyExistsError) {
        throw error;
      }
      throw error;
    }
  }
}
