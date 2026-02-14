import { DeleteUserAvatarUseCase } from './delete-user-avatar.use-case';
import { UserNotFoundError } from './upload-user-avatar.use-case';
import { UserRepository } from '../../ports/user-repository';
import { User } from '../../../domain/entities/user';
import { IFileStorageService } from '../../ports/file-storage.interface';

describe('DeleteUserAvatarUseCase', () => {
  let useCase: DeleteUserAvatarUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let fileStorageService: jest.Mocked<IFileStorageService>;

  const mockUserWithAvatar = new User(
    'user-123',
    'João Silva',
    'joao@example.com',
    'hashed-password',
    'USER',
    new Date('2024-01-01'),
    new Date('2024-01-01'),
    null,
    'https://cloudinary.com/avatars/user-123.jpg',
    null,
    null,
  );

  const mockUserWithoutAvatar = new User(
    'user-456',
    'Maria Silva',
    'maria@example.com',
    'hashed-password',
    'USER',
    new Date('2024-01-01'),
    new Date('2024-01-01'),
    null,
    null,
    null,
    null,
  );

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByResetToken: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateRefreshToken: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<UserRepository>;

    fileStorageService = {
      upload: jest.fn(),
      delete: jest.fn(),
      getUrl: jest.fn(),
    } as jest.Mocked<IFileStorageService>;

    useCase = new DeleteUserAvatarUseCase(userRepository, fileStorageService);
  });

  describe('execute', () => {
    it('should delete avatar from Cloudinary and database', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUserWithAvatar);
      userRepository.update.mockResolvedValue(
        new User(
          'user-123',
          'João Silva',
          'joao@example.com',
          'hashed-password',
          'USER',
          new Date('2024-01-01'),
          new Date(),
          null,
          null,
          null,
          null,
        ),
      );

      // Act
      await useCase.execute('user-123');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('user-123');
      expect(fileStorageService.delete).toHaveBeenCalledWith('avatars/user-123');
      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        avatar: null,
      });
    });

    it('should not fail if user does not have avatar', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUserWithoutAvatar);

      // Act
      await useCase.execute('user-456');

      // Assert
      expect(fileStorageService.delete).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('non-existent-user')).rejects.toThrow(
        UserNotFoundError,
      );
      expect(fileStorageService.delete).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should still update database even if Cloudinary delete fails', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUserWithAvatar);
      fileStorageService.delete.mockRejectedValue(new Error('Cloudinary error'));
      userRepository.update.mockResolvedValue(mockUserWithoutAvatar);

      // Act
      await useCase.execute('user-123');

      // Assert
      expect(fileStorageService.delete).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        avatar: null,
      });
    });
  });
});
