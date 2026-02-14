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
        role: 'cliente',
      });
    });
  });

  describe('Error Cases', () => {
    it('should throw UserNotFoundError when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('invalid-id')).rejects.toThrow(UserNotFoundError);
    });
  });
});
