import { UploadUserAvatarUseCase, UserNotFoundError } from './upload-user-avatar.use-case';
import { UserRepository } from '../../ports/user-repository';
import { User } from '../../../domain/entities/user';
import { IFileStorageService } from '../../ports/file-storage.interface';

describe('UploadUserAvatarUseCase', () => {
  let useCase: UploadUserAvatarUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let fileStorageService: jest.Mocked<IFileStorageService>;

  const mockUser = new User(
    'user-123',
    'João Silva',
    'joao@example.com',
    'hashed-password',
    'USER',
    new Date('2024-01-01'),
    new Date('2024-01-01'),
    null,
    null,
    null,
    null,
  );

  const mockFile: Express.Multer.File = {
    fieldname: 'avatar',
    originalname: 'profile.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 1024,
  } as Express.Multer.File;

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

    useCase = new UploadUserAvatarUseCase(userRepository, fileStorageService);
  });

  describe('execute', () => {
    it('should upload avatar and return URL', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      fileStorageService.upload.mockResolvedValue({
        publicId: 'avatars/user-123',
        url: 'http://cloudinary.com/avatars/user-123.jpg',
        secureUrl: 'https://cloudinary.com/avatars/user-123.jpg',
        format: 'jpg',
        width: 500,
        height: 500,
        bytes: 1024,
      });
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
          'https://cloudinary.com/avatars/user-123.jpg',
          null,
          null,
        ),
      );

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        file: mockFile,
      });

      // Assert
      expect(result.avatarUrl).toBe('https://cloudinary.com/avatars/user-123.jpg');
      expect(userRepository.findById).toHaveBeenCalledWith('user-123');
      expect(fileStorageService.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: mockFile.buffer,
          mimetype: mockFile.mimetype,
          originalname: mockFile.originalname,
          size: mockFile.size,
        }),
        'avatars',
      );
      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        avatar: 'https://cloudinary.com/avatars/user-123.jpg',
      });
    });

    it('should delete old avatar before uploading new one', async () => {
      // Arrange
      const userWithAvatar = new User(
        'user-123',
        'João Silva',
        'joao@example.com',
        'hashed-password',
        'USER',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
        null,
        'https://cloudinary.com/avatars/old-avatar.jpg',
        null,
        null,
      );

      userRepository.findById.mockResolvedValue(userWithAvatar);
      fileStorageService.upload.mockResolvedValue({
        publicId: 'avatars/user-123',
        url: 'http://cloudinary.com/avatars/user-123.jpg',
        secureUrl: 'https://cloudinary.com/avatars/user-123.jpg',
        format: 'jpg',
        width: 500,
        height: 500,
        bytes: 1024,
      });
      userRepository.update.mockResolvedValue(userWithAvatar);

      // Act
      await useCase.execute({
        userId: 'user-123',
        file: mockFile,
      });

      // Assert
      expect(fileStorageService.delete).toHaveBeenCalledWith('avatars/old-avatar');
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          userId: 'non-existent-user',
          file: mockFile,
        }),
      ).rejects.toThrow(UserNotFoundError);
      expect(fileStorageService.upload).not.toHaveBeenCalled();
    });

    it('should not delete old avatar if user does not have one', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      fileStorageService.upload.mockResolvedValue({
        publicId: 'avatars/user-123',
        url: 'http://cloudinary.com/avatars/user-123.jpg',
        secureUrl: 'https://cloudinary.com/avatars/user-123.jpg',
        format: 'jpg',
        width: 500,
        height: 500,
        bytes: 1024,
      });
      userRepository.update.mockResolvedValue(mockUser);

      // Act
      await useCase.execute({
        userId: 'user-123',
        file: mockFile,
      });

      // Assert
      expect(fileStorageService.delete).not.toHaveBeenCalled();
    });
  });
});
