import { GetUserProfileUseCase, UserNotFoundError } from './get-user-profile.use-case';
import { UserRepository } from '../ports/user-repository';
import { User } from '../../domain/entities/user';

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockUser = new User(
    'user-123',
    'João Silva',
    'joao@email.com',
    'hashed-password',
    'USER',
    new Date(),
    new Date(),
    '11999999999',
    'https://avatar.com/joao.jpg',
    'cliente',
    null
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

    useCase = new GetUserProfileUseCase(mockUserRepository);
  });

  describe('Happy Path', () => {
    it('should return user profile when user exists', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute('user-123');

      expect(result).toEqual({
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
        avatar: 'https://avatar.com/joao.jpg',
        role: 'USER',
        userType: 'cliente',
      });
    });

    it('should return userType "admin" for ADMIN user with null userRole', async () => {
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
        null
      );
      mockUserRepository.findById.mockResolvedValue(adminUser);

      const result = await useCase.execute('admin-1');

      expect(result.role).toBe('ADMIN');
      expect(result.userType).toBe('admin');
    });

    it('should return userType "proprietario" for USER with userRole "proprietario"', async () => {
      const proprietarioUser = new User(
        'user-456',
        'Carlos Proprietário',
        'carlos@email.com',
        'hashed-password',
        'USER',
        new Date(),
        new Date(),
        null,
        null,
        'proprietario',
        null
      );
      mockUserRepository.findById.mockResolvedValue(proprietarioUser);

      const result = await useCase.execute('user-456');

      expect(result.userType).toBe('proprietario');
    });
  });

  describe('Error Cases', () => {
    it('should throw UserNotFoundError when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('invalid-id')).rejects.toThrow(UserNotFoundError);
    });
  });
});
