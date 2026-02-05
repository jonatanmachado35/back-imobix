import { NotFoundException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { DeleteAnuncioUseCase } from './delete-anuncio.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService } from '../../ports/file-storage.interface';

describe('DeleteAnuncioUseCase', () => {
  let useCase: DeleteAnuncioUseCase;
  let prisma: jest.Mocked<PrismaService>;
  let fileStorage: jest.Mocked<IFileStorageService>;

  beforeEach(() => {
    // Mock do Prisma
    const mockFindUnique = jest.fn();
    const mockDelete = jest.fn();

    prisma = {
      anuncio: {
        findUnique: mockFindUnique,
        delete: mockDelete,
      },
    } as any;

    // Mock do FileStorage
    fileStorage = {
      delete: jest.fn(),
      upload: jest.fn(),
    } as any;

    useCase = new DeleteAnuncioUseCase(prisma, fileStorage);
  });

  describe('execute', () => {
    it('should delete anuncio and all its images from Cloudinary', async () => {
      // Arrange
      const anuncioId = 'anuncio-123';
      const userId = 'user-123';
      const mockAnuncio = {
        id: anuncioId,
        titulo: 'Casa na Praia',
        criadoPorId: userId, // Dono do anúncio
        images: [
          { id: 'img-1', publicId: 'anuncios/foto1', url: 'https://cloudinary.com/foto1.jpg' },
          { id: 'img-2', publicId: 'anuncios/foto2', url: 'https://cloudinary.com/foto2.jpg' },
          { id: 'img-3', publicId: 'anuncios/foto3', url: 'https://cloudinary.com/foto3.jpg' },
        ],
      };

      (prisma.anuncio.findUnique as jest.Mock).mockResolvedValue(mockAnuncio);
      (prisma.anuncio.delete as jest.Mock).mockResolvedValue(mockAnuncio);
      fileStorage.delete.mockResolvedValue(undefined);

      // Act
      await useCase.execute(anuncioId, userId, 'USER');

      // Assert
      expect(prisma.anuncio.findUnique).toHaveBeenCalledWith({
        where: { id: anuncioId },
        include: { images: true },
      });

      // Deve deletar todas as 3 imagens do Cloudinary
      expect(fileStorage.delete).toHaveBeenCalledTimes(3);
      expect(fileStorage.delete).toHaveBeenCalledWith('anuncios/foto1');
      expect(fileStorage.delete).toHaveBeenCalledWith('anuncios/foto2');
      expect(fileStorage.delete).toHaveBeenCalledWith('anuncios/foto3');

      // Deve deletar anúncio do banco (cascade deleta images)
      expect(prisma.anuncio.delete).toHaveBeenCalledWith({
        where: { id: anuncioId },
      });
    });

    it('should throw NotFoundException if anuncio does not exist', async () => {
      // Arrange
      const anuncioId = 'anuncio-inexistente';
      const userId = 'user-123';
      (prisma.anuncio.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(anuncioId, userId, 'USER')).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(anuncioId, userId, 'USER')).rejects.toThrow('Anúncio não encontrado');

      // Não deve tentar deletar nada
      expect(fileStorage.delete).not.toHaveBeenCalled();
      expect(prisma.anuncio.delete).not.toHaveBeenCalled();
    });

    it('should delete anuncio even if it has no images', async () => {
      // Arrange
      const anuncioId = 'anuncio-sem-imagens';
      const userId = 'user-456';
      const mockAnuncio = {
        id: anuncioId,
        titulo: 'Casa Sem Fotos',
        criadoPorId: userId,
        images: [], // Sem imagens
      };

      (prisma.anuncio.findUnique as jest.Mock).mockResolvedValue(mockAnuncio);
      (prisma.anuncio.delete as jest.Mock).mockResolvedValue(mockAnuncio);

      // Act
      await useCase.execute(anuncioId, userId, 'USER');

      // Assert
      expect(fileStorage.delete).not.toHaveBeenCalled(); // Sem imagens para deletar
      expect(prisma.anuncio.delete).toHaveBeenCalledWith({
        where: { id: anuncioId },
      });
    });

    it('should continue deleting anuncio even if some Cloudinary deletes fail', async () => {
      // Arrange
      const anuncioId = 'anuncio-456';
      const userId = 'user-789';
      const mockAnuncio = {
        id: anuncioId,
        titulo: 'Casa na Praia',
        criadoPorId: userId,
        images: [
          { id: 'img-1', publicId: 'anuncios/foto1', url: 'https://cloudinary.com/foto1.jpg' },
          { id: 'img-2', publicId: 'anuncios/foto2', url: 'https://cloudinary.com/foto2.jpg' },
        ],
      };

      (prisma.anuncio.findUnique as jest.Mock).mockResolvedValue(mockAnuncio);
      (prisma.anuncio.delete as jest.Mock).mockResolvedValue(mockAnuncio);

      // Simula falha no delete do Cloudinary (foto já deletada manualmente)
      fileStorage.delete
        .mockResolvedValueOnce(undefined) // foto1 OK
        .mockRejectedValueOnce(new Error('Resource not found')); // foto2 falha

      // Act
      await useCase.execute(anuncioId, userId, 'USER');

      // Assert - deve usar Promise.allSettled() para não falhar se imagem não existe
      expect(fileStorage.delete).toHaveBeenCalledTimes(2);
      expect(prisma.anuncio.delete).toHaveBeenCalled(); // Deve deletar mesmo com falha no Cloudinary
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      // Arrange
      const anuncioId = 'anuncio-123';
      const ownerId = 'user-owner';
      const differentUserId = 'user-other';
      const mockAnuncio = {
        id: anuncioId,
        titulo: 'Casa na Praia',
        criadoPorId: ownerId, // Dono é outro usuário
        images: [],
      };

      (prisma.anuncio.findUnique as jest.Mock).mockResolvedValue(mockAnuncio);

      // Act & Assert
      await expect(useCase.execute(anuncioId, differentUserId, 'USER')).rejects.toThrow(ForbiddenException);
      await expect(useCase.execute(anuncioId, differentUserId, 'USER')).rejects.toThrow(
        'Você não tem permissão para deletar este anúncio'
      );

      // Não deve deletar nada
      expect(fileStorage.delete).not.toHaveBeenCalled();
      expect(prisma.anuncio.delete).not.toHaveBeenCalled();
    });

    it('should allow ADMIN to delete any anuncio', async () => {
      // Arrange
      const anuncioId = 'anuncio-123';
      const ownerId = 'user-owner';
      const adminUserId = 'admin-user';
      const mockAnuncio = {
        id: anuncioId,
        titulo: 'Casa na Praia',
        criadoPorId: ownerId, // Dono é outro usuário
        images: [
          { id: 'img-1', publicId: 'anuncios/foto1', url: 'https://cloudinary.com/foto1.jpg' },
        ],
      };

      (prisma.anuncio.findUnique as jest.Mock).mockResolvedValue(mockAnuncio);
      (prisma.anuncio.delete as jest.Mock).mockResolvedValue(mockAnuncio);
      fileStorage.delete.mockResolvedValue(undefined);

      // Act - ADMIN deletando anúncio de outro usuário
      await useCase.execute(anuncioId, adminUserId, 'ADMIN');

      // Assert - Deve permitir por ser ADMIN
      expect(fileStorage.delete).toHaveBeenCalledTimes(1);
      expect(prisma.anuncio.delete).toHaveBeenCalledWith({
        where: { id: anuncioId },
      });
    });

    it('should allow user to delete their own anuncio', async () => {
      // Arrange
      const anuncioId = 'anuncio-123';
      const userId = 'user-123';
      const mockAnuncio = {
        id: anuncioId,
        titulo: 'Casa na Praia',
        criadoPorId: userId, // Mesmo usuário
        images: [],
      };

      (prisma.anuncio.findUnique as jest.Mock).mockResolvedValue(mockAnuncio);
      (prisma.anuncio.delete as jest.Mock).mockResolvedValue(mockAnuncio);

      // Act
      await useCase.execute(anuncioId, userId, 'USER');

      // Assert - Deve permitir por ser o dono
      expect(prisma.anuncio.delete).toHaveBeenCalled();
    });

    it('should allow deletion if anuncio has no owner (legacy data)', async () => {
      // Arrange
      const anuncioId = 'anuncio-legacy';
      const userId = 'user-123';
      const mockAnuncio = {
        id: anuncioId,
        titulo: 'Casa Legado',
        criadoPorId: null, // Anúncio sem dono (dados antigos)
        images: [],
      };

      (prisma.anuncio.findUnique as jest.Mock).mockResolvedValue(mockAnuncio);
      (prisma.anuncio.delete as jest.Mock).mockResolvedValue(mockAnuncio);

      // Act - Qualquer usuário pode deletar anúncios sem dono
      await useCase.execute(anuncioId, userId, 'USER');

      // Assert
      expect(prisma.anuncio.delete).toHaveBeenCalled();
    });
  });
});
