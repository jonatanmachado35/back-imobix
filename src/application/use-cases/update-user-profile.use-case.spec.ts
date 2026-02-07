import { UpdateUserProfileUseCase, UserNotFoundError } from './update-user-profile.use-case';
import { UserRepository } from '../ports/user-repository';
import { User } from '../../domain/entities/user';
import { EmailAlreadyExistsError } from './user-errors';

describe('UpdateUserProfileUseCase', () => {
  let useCase: UpdateUserProfileUseCase;
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
      create: jest.fn(),
      update: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    useCase = new UpdateUserProfileUseCase(mockUserRepository);
  });

  describe('Happy Path', () => {
    it('should update user name', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(
        new User(
          'user-123',
          'João Novo Nome',
          'joao@email.com',
          'hashed-password',
          'USER',
          new Date(),
          new Date(),
          '11999999999',
          'https://avatar.com/joao.jpg',
          'cliente',
          null
        )
      );

      const result = await useCase.execute('user-123', { name: 'João Novo Nome' });

      expect(result.name).toBe('João Novo Nome');
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', { nome: 'João Novo Nome' });
    });

    it('should update user email when new email is not taken', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(
        new User(
          'user-123',
          'João Silva',
          'novo@email.com',
          'hashed-password',
          'USER',
          new Date(),
          new Date(),
          '11999999999',
          null,
          'cliente',
          null
        )
      );

      const result = await useCase.execute('user-123', { email: 'novo@email.com' });

      expect(result.email).toBe('novo@email.com');
    });

    it('should update multiple fields at once', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(
        new User(
          'user-123',
          'Nome Atualizado',
          'joao@email.com',
          'hashed-password',
          'USER',
          new Date(),
          new Date(),
          '11888888888',
          'https://new-avatar.com/joao.jpg',
          'cliente',
          null
        )
      );

      const result = await useCase.execute('user-123', {
        name: 'Nome Atualizado',
        phone: '11888888888',
        avatar: 'https://new-avatar.com/joao.jpg',
      });

      expect(result.name).toBe('Nome Atualizado');
      expect(result.phone).toBe('11888888888');
      expect(result.avatar).toBe('https://new-avatar.com/joao.jpg');
    });
  });

  describe('Error Cases', () => {
    it('should throw UserNotFoundError when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('invalid-id', { name: 'Test' })).rejects.toThrow(UserNotFoundError);
    });

    it('should throw EmailAlreadyExistsError when new email is already taken', async () => {
      const anotherUser = new User(
        'user-456',
        'Outro Usuário',
        'outro@email.com',
        'hash',
        'USER',
        new Date(),
        new Date()
      );
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByEmail.mockResolvedValue(anotherUser);

      await expect(useCase.execute('user-123', { email: 'outro@email.com' })).rejects.toThrow(EmailAlreadyExistsError);
    });

    it('should allow keeping the same email', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser); // Same user
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await useCase.execute('user-123', { email: 'joao@email.com' });

      expect(result.email).toBe('joao@email.com');
    });
  });
});
