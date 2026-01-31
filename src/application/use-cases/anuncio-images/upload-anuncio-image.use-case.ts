import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  FileUploadDto,
  IFileStorageService,
} from '../../ports/file-storage.interface';

/**
 * Use Case: Upload de imagem para anúncio
 * 
 * Responsabilidades:
 * 1. Validar que o anúncio existe
 * 2. Validar quantidade máxima de imagens (20)
 * 3. Fazer upload para provedor de armazenamento
 * 4. Salvar metadata no banco de dados
 * 5. Gerenciar rollback em caso de falha
 * 
 * Clean Architecture: Orquestra regras de negócio sem conhecer detalhes de infraestrutura
 */
@Injectable()
export class UploadAnuncioImageUseCase {
  private readonly MAX_IMAGES_PER_ANUNCIO = 20;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(
    anuncioId: string,
    file: FileUploadDto,
    isPrimary = false,
    displayOrder = 0,
  ) {
    // 1. Validar que anúncio existe
    const anuncio = await this.prisma.anuncio.findUnique({
      where: { id: anuncioId },
      include: { images: true },
    });

    if (!anuncio) {
      throw new NotFoundException(`Anúncio com ID ${anuncioId} não encontrado`);
    }

    // 2. Validar quantidade máxima de imagens
    if (anuncio.images.length >= this.MAX_IMAGES_PER_ANUNCIO) {
      throw new BadRequestException(
        `Anúncio já possui o máximo de ${this.MAX_IMAGES_PER_ANUNCIO} imagens`,
      );
    }

    let uploadResult;
    let createdImage;

    try {
      // 3. Upload para provedor de armazenamento (Cloudinary)
      uploadResult = await this.fileStorageService.upload(file, 'anuncios');

      // 4. Se isPrimary=true, remover flag das outras imagens
      if (isPrimary) {
        await this.prisma.anuncioImage.updateMany({
          where: { anuncioId },
          data: { isPrimary: false },
        });
      }

      // 5. Salvar metadata no banco de dados
      createdImage = await this.prisma.anuncioImage.create({
        data: {
          anuncioId,
          publicId: uploadResult.publicId,
          url: uploadResult.url,
          secureUrl: uploadResult.secureUrl,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          displayOrder,
          isPrimary,
        },
      });

      return createdImage;
    } catch (error) {
      // Rollback: Se salvou no storage mas falhou no DB, deletar do storage
      if (uploadResult && !createdImage) {
        try {
          await this.fileStorageService.delete(uploadResult.publicId);
        } catch (deleteError) {
          // Log mas não falhar - o importante é informar o erro original
          console.error('Failed to rollback uploaded file:', deleteError);
        }
      }

      throw error;
    }
  }
}
