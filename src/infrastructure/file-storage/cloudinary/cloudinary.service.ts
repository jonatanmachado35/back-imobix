import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import {
  FileUploadDto,
  IFileStorageService,
  ImageTransformations,
  UploadResult,
} from '../../../application/ports/file-storage.interface';
import { getCloudinaryConfig } from './cloudinary.config';

/**
 * Implementação do IFileStorageService usando Cloudinary.
 * Esta classe é um Adapter que converte a interface genérica
 * em chamadas específicas da API do Cloudinary.
 * 
 * Clean Architecture: Infrastructure layer implementa porta da Application layer
 */
@Injectable()
export class CloudinaryService implements IFileStorageService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    // Configurar Cloudinary no construtor
    const config = getCloudinaryConfig();

    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true, // Sempre usar HTTPS
    });

    this.logger.log('Cloudinary configured successfully');
  }

  async upload(file: FileUploadDto, folder = 'anuncios'): Promise<UploadResult> {
    try {
      // Validações de aplicação
      this.validateFile(file);

      // Upload para Cloudinary usando stream
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              this.logger.error('Cloudinary upload failed', error);
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(file.buffer);
      });

      this.logger.log(`File uploaded successfully: ${result.public_id}`);

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to Cloudinary', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async delete(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Delete failed with result: ${result.result}`);
      }

      this.logger.log(`File deleted successfully: ${publicId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from Cloudinary: ${publicId}`, error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  getUrl(publicId: string, transformations?: ImageTransformations): string {
    if (!transformations) {
      return cloudinary.url(publicId, { secure: true });
    }

    const options: any = {
      secure: true,
    };

    if (transformations.width) options.width = transformations.width;
    if (transformations.height) options.height = transformations.height;
    if (transformations.crop) options.crop = transformations.crop;
    if (transformations.quality) options.quality = transformations.quality;
    if (transformations.format) options.format = transformations.format;

    return cloudinary.url(publicId, options);
  }

  /**
   * Validações de segurança e tamanho
   */
  private validateFile(file: FileUploadDto): void {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIMETYPES.join(', ')}`);
    }
  }
}
