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
      findAll: jest.fn(),
      saveWithAuditLog: jest.fn(),
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
        role: 'USER',
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

    it('should generate token payload with system role (not userRole)', async () => {
      mockTokenGenerator.verifyRefreshToken.mockReturnValue({
        userId: 'user-123',
        email: 'joao@email.com',
        role: 'USER',
      });
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockTokenGenerator.generate.mockReturnValue('new-access-token');
      mockTokenGenerator.generateRefreshToken.mockReturnValue('new-refresh-token');

      await useCase.execute('valid-refresh-token');

      // tokenPayload deve usar o role de sistema (USER/ADMIN), não o userRole de negócio
      expect(mockTokenGenerator.generate).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'USER' })
      );
      expect(mockTokenGenerator.generateRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'USER' })
      );
    });

    it('should generate token payload with ADMIN role for admin user', async () => {
      const adminUser = new User(
        'admin-1',
        'Admin Imobix',
        'admin@imobix.com',
        'hashed-password',
        'ADMIN',
        new Date(),
        new Date(),
        null,
        null,
        null, // userRole = null
        'valid-refresh-token'
      );
      mockTokenGenerator.verifyRefreshToken.mockReturnValue({
        userId: 'admin-1',
        email: 'admin@imobix.com',
        role: 'ADMIN',
      });
      mockUserRepository.findById.mockResolvedValue(adminUser);
      mockTokenGenerator.generate.mockReturnValue('new-access-token');
      mockTokenGenerator.generateRefreshToken.mockReturnValue('new-refresh-token');

      await useCase.execute('valid-refresh-token');

      expect(mockTokenGenerator.generate).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'ADMIN' })
      );
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
        role: 'USER',
      });
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('valid-token')).rejects.toThrow(InvalidRefreshTokenError);
    });

    it('should throw InvalidRefreshTokenError when stored token does not match', async () => {
      mockTokenGenerator.verifyRefreshToken.mockReturnValue({
        userId: 'user-123',
        email: 'joao@email.com',
        role: 'USER',
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
