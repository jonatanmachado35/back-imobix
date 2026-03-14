import {
  SavePushTokenUseCase,
  SavePushTokenInput,
  InvalidPushTokenError,
} from './save-push-token.use-case';
import { PushTokenRepository } from '../../ports/push-token-repository';

// In-memory repository for testing
class InMemoryPushTokenRepository implements PushTokenRepository {
  private tokens: Array<{ userId: string; token: string; platform?: string }> = [];

  async save(userId: string, token: string, platform?: string): Promise<void> {
    const exists = this.tokens.some((t) => t.token === token);
    if (!exists) {
      this.tokens.push({ userId, token, platform });
    }
  }

  async findByUserId(userId: string): Promise<string[]> {
    return this.tokens.filter((t) => t.userId === userId).map((t) => t.token);
  }

  async findByUserIds(userIds: string[]): Promise<string[]> {
    return this.tokens
      .filter((t) => userIds.includes(t.userId))
      .map((t) => t.token);
  }

  async deleteByToken(token: string): Promise<void> {
    this.tokens = this.tokens.filter((t) => t.token !== token);
  }

  // Helper for tests
  getAll(): Array<{ userId: string; token: string; platform?: string }> {
    return this.tokens;
  }
}

describe('SavePushTokenUseCase', () => {
  let useCase: SavePushTokenUseCase;
  let repository: InMemoryPushTokenRepository;

  beforeEach(() => {
    repository = new InMemoryPushTokenRepository();
    useCase = new SavePushTokenUseCase(repository);
  });

  const validInput: SavePushTokenInput = {
    userId: 'user-1',
    pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    platform: 'ios',
  };

  describe('Happy Path', () => {
    it('should save a valid Expo push token', async () => {
      await useCase.execute(validInput);

      const saved = repository.getAll();
      expect(saved).toHaveLength(1);
      expect(saved[0].userId).toBe('user-1');
      expect(saved[0].token).toBe('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]');
      expect(saved[0].platform).toBe('ios');
    });

    it('should save token without platform', async () => {
      await useCase.execute({ userId: 'user-1', pushToken: 'ExponentPushToken[abc123]' });

      const saved = repository.getAll();
      expect(saved).toHaveLength(1);
      expect(saved[0].platform).toBeUndefined();
    });

    it('should allow multiple tokens for the same user (multi-device)', async () => {
      await useCase.execute({ userId: 'user-1', pushToken: 'ExponentPushToken[device1]', platform: 'ios' });
      await useCase.execute({ userId: 'user-1', pushToken: 'ExponentPushToken[device2]', platform: 'android' });

      const tokens = await repository.findByUserId('user-1');
      expect(tokens).toHaveLength(2);
      expect(tokens).toContain('ExponentPushToken[device1]');
      expect(tokens).toContain('ExponentPushToken[device2]');
    });

    it('should be idempotent — saving the same token twice does not duplicate it', async () => {
      await useCase.execute(validInput);
      await useCase.execute(validInput);

      const saved = repository.getAll();
      expect(saved).toHaveLength(1);
    });

    it('should accept token with complex content inside brackets', async () => {
      const complexToken = 'ExponentPushToken[AbCdEfGhIjKlMnOpQrStUvWxYz-1234567890]';
      await useCase.execute({ userId: 'user-2', pushToken: complexToken });

      const tokens = await repository.findByUserId('user-2');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toBe(complexToken);
    });
  });

  describe('Token Validation', () => {
    it('should throw InvalidPushTokenError for empty string', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pushToken: '' }),
      ).rejects.toThrow(InvalidPushTokenError);
    });

    it('should throw InvalidPushTokenError for token without ExponentPushToken prefix', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pushToken: '[xxxxxxxxxxxxxxxxxxxxxx]' }),
      ).rejects.toThrow(InvalidPushTokenError);
    });

    it('should throw InvalidPushTokenError for token with wrong prefix', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pushToken: 'FCMToken[xxxxxxxxxxxxxxxxxxxxxx]' }),
      ).rejects.toThrow(InvalidPushTokenError);
    });

    it('should throw InvalidPushTokenError for token without brackets', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pushToken: 'ExponentPushTokenxxxxxxxxxxxxxxxxxxxxxx' }),
      ).rejects.toThrow(InvalidPushTokenError);
    });

    it('should throw InvalidPushTokenError for token with empty brackets', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pushToken: 'ExponentPushToken[]' }),
      ).rejects.toThrow(InvalidPushTokenError);
    });

    it('should throw InvalidPushTokenError for raw text', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pushToken: 'invalid-token' }),
      ).rejects.toThrow(InvalidPushTokenError);
    });

    it('should include the invalid token in the error message', async () => {
      const badToken = 'not-a-valid-token';
      await expect(
        useCase.execute({ userId: 'user-1', pushToken: badToken }),
      ).rejects.toThrow(`Invalid Expo push token format: ${badToken}`);
    });

    it('should NOT save the token when validation fails', async () => {
      await expect(
        useCase.execute({ userId: 'user-1', pushToken: 'invalid' }),
      ).rejects.toThrow(InvalidPushTokenError);

      const saved = repository.getAll();
      expect(saved).toHaveLength(0);
    });
  });
});
