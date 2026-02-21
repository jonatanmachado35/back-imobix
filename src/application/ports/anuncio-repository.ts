import { Anuncio, Prisma } from '@prisma/client';
import { AnuncioImage } from '@prisma/client';

export type AnuncioWithImages = Anuncio & { images: AnuncioImage[] };

export interface AnuncioRepository {
  findAll(props?: { includeImages?: boolean }): Promise<Anuncio[]>;
  findById(id: string): Promise<Anuncio | null>;
  findByIdWithImages(id: string): Promise<AnuncioWithImages | null>;
  create(data: Prisma.AnuncioCreateInput): Promise<Anuncio>;
  update(id: string, data: Prisma.AnuncioUpdateInput): Promise<Anuncio>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: string): Promise<Anuncio>;
  
  // Image methods
  findImagesByAnuncioId(anuncioId: string): Promise<AnuncioImage[]>;
  findImageById(imageId: string, anuncioId: string): Promise<AnuncioImage | null>;
  createImage(data: {
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
  }): Promise<AnuncioImage>;
  deleteImage(imageId: string): Promise<void>;
  clearImagePrimary(anuncioId: string): Promise<void>;
  setImagePrimary(imageId: string): Promise<AnuncioImage>;
}
