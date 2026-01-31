import { Module } from '@nestjs/common';
import { IFileStorageService } from '../../../application/ports/file-storage.interface';
import { CloudinaryService } from './cloudinary.service';

/**
 * Módulo de infraestrutura para Cloudinary.
 * Registra o CloudinaryService como provider da interface IFileStorageService.
 * 
 * Este módulo pode ser importado por outros módulos que precisam de upload de arquivos.
 */
@Module({
  providers: [
    {
      provide: IFileStorageService,
      useClass: CloudinaryService,
    },
  ],
  exports: [IFileStorageService],
})
export class CloudinaryModule {}
