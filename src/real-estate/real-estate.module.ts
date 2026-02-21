import { Module } from '@nestjs/common';
import { RealEstateService } from './real-estate.service';
import { AnunciosController } from './anuncios.controller';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { CloudinaryModule } from '../infrastructure/file-storage/cloudinary/cloudinary.module';
import { UploadAnuncioImageUseCase } from '../application/use-cases/anuncio-images/upload-anuncio-image.use-case';
import { DeleteAnuncioImageUseCase } from '../application/use-cases/anuncio-images/delete-anuncio-image.use-case';
import { ListAnuncioImagesUseCase } from '../application/use-cases/anuncio-images/list-anuncio-images.use-case';
import { SetPrimaryImageUseCase } from '../application/use-cases/anuncio-images/set-primary-image.use-case';
import { CreateAnuncioWithImagesUseCase } from '../application/use-cases/anuncio-images/create-anuncio-with-images.use-case';
import { DeleteAnuncioUseCase } from '../application/use-cases/anuncio-images/delete-anuncio.use-case';
import { PrismaAnuncioRepository } from '../infrastructure/database/prisma-anuncio.repository';
import { ANUNCIO_REPOSITORY } from './real-estate.tokens';

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  controllers: [AnunciosController],
  providers: [
    RealEstateService,
    { provide: ANUNCIO_REPOSITORY, useClass: PrismaAnuncioRepository },
    UploadAnuncioImageUseCase,
    DeleteAnuncioImageUseCase,
    ListAnuncioImagesUseCase,
    SetPrimaryImageUseCase,
    CreateAnuncioWithImagesUseCase,
    DeleteAnuncioUseCase,
  ],
  exports: [RealEstateService, ANUNCIO_REPOSITORY],
})
export class RealEstateModule { }
