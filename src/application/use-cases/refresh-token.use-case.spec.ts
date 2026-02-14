import { RefreshTokenUseCase, InvalidRefreshTokenError } from './refresh-token.use-case';
import { UserRepository } from '../ports/user-repository';
import { TokenGenerator } from '../ports/token-generator';
import { User } from '../../domain/entities/user';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockTokenGenerator: jest.Mocked<TokenGenerator>;

  const mockUser = new User(
    'user-123',
    'João Silva',
    'joao@email.com',
    'hashed-password',
    'USER',
    new Date(),
    new Date(),
    null,
    null,
    'cliente',
    'valid-refresh-token'
  );

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByResetToken: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateRefreshToken: jest.fn(),
      save: jest.fn(),
    };

    mockTokenGenerator = {
      generate: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    useCase = new RefreshTokenUseCase(mockUserRepository, mockTokenGenerator);
  });

  describe('Happy Path', () => {
    it('should return new tokens when refresh token is valid', async () => {
      mockTokenGenerator.verifyRefreshToken.mockReturnValue({
        userId: 'user-123',
        email: 'joao@email.com',
        role: 'cliente',
      });
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockTokenGenerator.generate.mockReturnValue('new-access-token');
      mockTokenGenerator.generateRefreshToken.mockReturnValue('new-refresh-token');

      const result = await useCase.execute('valid-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(mockUserRepository.updateRefreshToken).toHaveBeenCalledWith('user-123', 'new-refresh-token');
    });
  });

  describe('Error Cases', () => {
    it('should throw InvalidRefreshTokenError when token is invalid', async () => {
      mockTokenGenerator.verifyRefreshToken.mockReturnValue(null);

      await expect(useCase.execute('invalid-token')).rejects.toThrow(InvalidRefreshTokenError);
    });

    it('should throw InvalidRefreshTokenError when user not found', async () => {
      mockTokenGenerator.verifyRefreshToken.mockReturnValue({
        userId: 'user-123',
        email: 'joao@email.com',
        role: 'cliente',
      });
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('valid-token')).rejects.toThrow(InvalidRefreshTokenError);
    });

    it('should throw InvalidRefreshTokenError when stored token does not match', async () => {
      mockTokenGenerator.verifyRefreshToken.mockReturnValue({
        userId: 'user-123',
        email: 'joao@email.com',
        role: 'cliente',
      });
      const userWithDifferentToken = new User(
        'user-123',
        'João Silva',
        'joao@email.com',
        'hashed-password',
        'USER',
        new Date(),
        new Date(),
        null,
        null,
        'cliente',
        'different-refresh-token'
      );
      mockUserRepository.findById.mockResolvedValue(userWithDifferentToken);

      await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(InvalidRefreshTokenError);
    });
  });
});
