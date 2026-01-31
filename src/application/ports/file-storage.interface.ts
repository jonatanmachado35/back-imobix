/**
 * Port/Interface para serviço de armazenamento de arquivos.
 * Esta interface define o contrato que qualquer provedor de armazenamento
 * (Cloudinary, AWS S3, GCS, etc.) deve implementar.
 * 
 * Clean Architecture: Domain/Application layer não conhece detalhes de infraestrutura
 */

export interface FileUploadDto {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

export interface ImageTransformations {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  quality?: number | 'auto';
  format?: string;
}

export abstract class IFileStorageService {
  /**
   * Faz upload de um arquivo para o provedor de armazenamento
   * @param file - Objeto com dados do arquivo
   * @param folder - Pasta opcional para organização
   * @returns Resultado do upload com URLs e metadados
   */
  abstract upload(file: FileUploadDto, folder?: string): Promise<UploadResult>;

  /**
   * Deleta um arquivo do provedor de armazenamento
   * @param publicId - Identificador único do arquivo
   */
  abstract delete(publicId: string): Promise<void>;

  /**
   * Obtém URL do arquivo com transformações opcionais
   * @param publicId - Identificador único do arquivo
   * @param transformations - Transformações de imagem opcionais
   * @returns URL do arquivo
   */
  abstract getUrl(
    publicId: string,
    transformations?: ImageTransformations,
  ): string;
}
