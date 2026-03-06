import { UserRepository } from '../ports/user-repository';
import { EmailAlreadyExistsError } from './user-errors';
import { resolveUserType } from './login.use-case';

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export interface UpdateProfileInput {
  /** Aceita tanto 'name' quanto 'nome' para compatibilidade (ADR-006 seção 2.2) */
  name?: string;
  nome?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  /** Marca onboarding como concluído */
  primeiroAcesso?: boolean;
  /** Tema da interface: 'light' | 'dark' | 'system' */
  tema?: string;
}

export interface UserProfileOutput {
  id: string;
  nome: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  userType: string;
  primeiroAcesso: boolean;
  /** Tema da interface: 'light' | 'dark' | 'system' */
  tema: string;
}

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) { }

  async execute(userId: string, input: UpdateProfileInput): Promise<UserProfileOutput> {
    // 1. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Aceita 'nome' ou 'name' (compatibilidade ADR-006 seção 2.2)
    const nomeResolvido = input.nome ?? input.name;

    // 3. If email is being changed, check if it's already taken
    if (input.email && input.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(input.email);
      if (existingUser && existingUser.id !== userId) {
        throw new EmailAlreadyExistsError(input.email);
      }
    }

    // 4. Update user
    const updatedUser = await this.userRepository.update(userId, {
      nome: nomeResolvido,
      email: input.email,
      phone: input.phone,
      avatar: input.avatar,
      primeiroAcesso: input.primeiroAcesso,
      tema: input.tema,
    });

    return {
      id: updatedUser.id,
      nome: updatedUser.nome,
      email: updatedUser.email,
      phone: updatedUser.phone ?? null,
      avatar: updatedUser.avatar ?? null,
      role: updatedUser.role,
      userType: resolveUserType(updatedUser.role, updatedUser.userRole),
      primeiroAcesso: updatedUser.primeiroAcesso,
      tema: updatedUser.tema,
    };
  }
}
