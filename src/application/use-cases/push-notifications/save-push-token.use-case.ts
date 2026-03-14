import { PushTokenRepository } from '../../ports/push-token-repository';

export interface SavePushTokenInput {
  userId: string;
  pushToken: string;
  platform?: string;
}

export class InvalidPushTokenError extends Error {
  constructor(token: string) {
    super(`Invalid Expo push token format: ${token}`);
    this.name = 'InvalidPushTokenError';
  }
}

export class SavePushTokenUseCase {
  constructor(private readonly pushTokenRepository: PushTokenRepository) {}

  async execute(input: SavePushTokenInput): Promise<void> {
    // Valida formato do token Expo
    if (!this.isValidExpoToken(input.pushToken)) {
      throw new InvalidPushTokenError(input.pushToken);
    }

    // Salva — o repository garante idempotência (não duplica se já existir)
    await this.pushTokenRepository.save(
      input.userId,
      input.pushToken,
      input.platform,
    );
  }

  private isValidExpoToken(token: string): boolean {
    return /^ExponentPushToken\[.+\]$/.test(token);
  }
}
