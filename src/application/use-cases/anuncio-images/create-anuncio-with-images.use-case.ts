import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { CreateAnuncioDto } from '../../../real-estate/dto/create-anuncio.dto';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class CreateAnuncioWithImagesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: IFileStorageService,
  ) { }

  async execute(dto: CreateAnuncioDto, images: UploadedFile[]) {
    // Validação: mínimo 1 imagem obrigatória
    if (!images || images.length === 0) {
      throw new BadRequestException('Pelo menos 1 imagem é obrigatória');
    }

    // Validação: máximo 20 imagens
    if (images.length > 20) {
      throw new BadRequestException('Máximo de 20 imagens permitido');
    }

    // Validação: tipos de arquivo permitidos
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = images.filter(
      (file) => !allowedMimeTypes.includes(file.mimetype),
    );

    if (invalidFiles.length > 0) {
      throw new BadRequestException(
        'Apenas imagens JPEG, PNG e WebP são permitidas',
      );
    }

    // 1. Upload paralelo de todas as imagens no Cloudinary
    const uploadPromises = images.map((file) =>
      this.fileStorage.upload(file, 'anuncios'),
    );

    let uploadResults;
    try {
      uploadResults = await Promise.all(uploadPromises);
    } catch (error) {
      throw new BadRequestException(
        `Falha no upload das imagens: ${error.message}`,
      );
    }

    // 2. Criar Anuncio + AnuncioImages em transação atômica
    try {
      const anuncio = await this.prisma.$transaction(async (tx) => {
        // 2a. Criar o Anuncio
        const createdAnuncio = await tx.anuncio.create({
          data: {
            titulo: dto.titulo,
            tipo: dto.tipo,
            endereco: dto.endereco,
            cidade: dto.cidade,
            estado: dto.estado,
            valor: dto.valorDiaria, // Mapeia valorDiaria → valor
          },
        });

        // 2b. Criar AnuncioImages vinculadas
        const imageDataArray = uploadResults.map((result, index) => ({
          anuncioId: createdAnuncio.id,
          publicId: result.publicId,
          url: result.url,
          secureUrl: result.secureUrl,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          displayOrder: index,
          isPrimary: index === 0, // Primeira imagem é a principal
        }));

        // Criar cada imagem individualmente
        for (const imageData of imageDataArray) {
          await tx.anuncioImage.create({ data: imageData });
        }

        // 2c. Retornar Anuncio com imagens incluídas
        return tx.anuncio.findUnique({
          where: { id: createdAnuncio.id },
          include: { images: true },
        });
      });

      return anuncio;
    } catch (error) {
      // 3. Rollback: deletar imagens do Cloudinary se transação falhar
      const deletePromises = uploadResults.map((result) =>
        this.fileStorage.delete(result.publicId),
      );
      await Promise.allSettled(deletePromises);

      throw new BadRequestException(
        `Falha ao criar anúncio: ${error.message}`,
      );
    }
  }
}
