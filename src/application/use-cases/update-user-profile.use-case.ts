import { UserRepository } from '../ports/user-repository';
import { EmailAlreadyExistsError } from './user-errors';

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface UserProfileOutput {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  userType: string;
}

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) { }

  async execute(userId: string, input: UpdateProfileInput): Promise<UserProfileOutput> {
    // 1. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. If email is being changed, check if it's already taken
    if (input.email && input.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(input.email);
      if (existingUser && existingUser.id !== userId) {
        throw new EmailAlreadyExistsError(input.email);
      }
    }

    // 3. Update user
    const updatedUser = await this.userRepository.update(userId, {
      nome: input.name,
      email: input.email,
      phone: input.phone,
      avatar: input.avatar,
    });

    return {
      id: updatedUser.id,
      name: updatedUser.nome,
      email: updatedUser.email,
      phone: updatedUser.phone ?? null,
      avatar: updatedUser.avatar ?? null,
      role: updatedUser.role,
      userType: updatedUser.userRole || 'cliente',
    };
  }
}
