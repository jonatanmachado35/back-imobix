import { TokenGenerator } from '../ports/token-generator';
import { UserRepository } from '../ports/user-repository';

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid refresh token');
    this.name = 'InvalidRefreshTokenError';
  }
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenGenerator: TokenGenerator,
  ) { }

  async execute(refreshToken: string): Promise<RefreshTokenOutput> {
    // 1. Verify the refresh token
    const payload = this.tokenGenerator.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new InvalidRefreshTokenError();
    }

    // 2. Find user
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    // 3. Verify stored refresh token matches
    if (user.refreshToken !== refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    // 4. Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.userRole || 'cliente',
    };

    const newAccessToken = this.tokenGenerator.generate(tokenPayload);
    const newRefreshToken = this.tokenGenerator.generateRefreshToken(tokenPayload);

    // 5. Update stored refresh token
    await this.userRepository.updateRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
