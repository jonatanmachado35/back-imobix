import { Injectable } from '@nestjs/common';
import { AnuncioRepository, AnuncioWithImages } from '../../application/ports/anuncio-repository';
import { PrismaService } from '../database/prisma.service';
import { Anuncio, Prisma, AnuncioImage } from '@prisma/client';

@Injectable()
export class PrismaAnuncioRepository implements AnuncioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(props?: { includeImages?: boolean }): Promise<Anuncio[]> {
    return this.prisma.anuncio.findMany({
      include: props?.includeImages ? { images: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Anuncio | null> {
    return this.prisma.anuncio.findUnique({ where: { id } });
  }

  async findByIdWithImages(id: string): Promise<AnuncioWithImages | null> {
    const result = await this.prisma.anuncio.findUnique({
      where: { id },
      include: { images: true },
    });
    return result as AnuncioWithImages;
  }

  async create(data: Prisma.AnuncioCreateInput): Promise<Anuncio> {
    return this.prisma.anuncio.create({ data });
  }

  async update(id: string, data: Prisma.AnuncioUpdateInput): Promise<Anuncio> {
    return this.prisma.anuncio.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.anuncio.delete({ where: { id } });
  }

  async updateStatus(id: string, status: string): Promise<Anuncio> {
    return this.prisma.anuncio.update({
      where: { id },
      data: { status },
    });
  }

  // Image methods
  async findImagesByAnuncioId(anuncioId: string): Promise<AnuncioImage[]> {
    return this.prisma.anuncioImage.findMany({
      where: { anuncioId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findImageById(imageId: string, anuncioId: string): Promise<AnuncioImage | null> {
    return this.prisma.anuncioImage.findFirst({
      where: {
        id: imageId,
        anuncioId,
      },
    });
  }

  async createImage(data: {
    anuncioId: string;
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    width?: number;
    height?: number;
    bytes?: number;
    displayOrder?: number;
    isPrimary?: boolean;
  }): Promise<AnuncioImage> {
    return this.prisma.anuncioImage.create({
      data: {
        anuncioId: data.anuncioId,
        publicId: data.publicId,
        url: data.url,
        secureUrl: data.secureUrl,
        format: data.format,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
        displayOrder: data.displayOrder || 0,
        isPrimary: data.isPrimary || false,
      },
    });
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.prisma.anuncioImage.delete({ where: { id: imageId } });
  }

  async clearImagePrimary(anuncioId: string): Promise<void> {
    await this.prisma.anuncioImage.updateMany({
      where: { anuncioId },
      data: { isPrimary: false },
    });
  }

  async setImagePrimary(imageId: string): Promise<AnuncioImage> {
    return this.prisma.anuncioImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }
}
