import { UserRepository } from '../ports/user-repository';

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export interface UserProfileOutput {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
}

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) { }

  async execute(userId: string): Promise<UserProfileOutput> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      id: user.id,
      name: user.nome,
      email: user.email,
      phone: user.phone ?? null,
      avatar: user.avatar ?? null,
      role: user.userRole ?? 'cliente',
    };
  }
}
