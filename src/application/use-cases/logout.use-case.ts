import { UserRepository } from '../ports/user-repository';

export class LogoutUseCase {
  constructor(private readonly userRepository: UserRepository) { }

  async execute(userId: string): Promise<void> {
    await this.userRepository.updateRefreshToken(userId, null);
  }
}
