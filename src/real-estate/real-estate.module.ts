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

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  controllers: [AnunciosController],
  providers: [
    RealEstateService,
    UploadAnuncioImageUseCase,
    DeleteAnuncioImageUseCase,
    ListAnuncioImagesUseCase,
    SetPrimaryImageUseCase,
    CreateAnuncioWithImagesUseCase,
    DeleteAnuncioUseCase,
  ],
})
export class RealEstateModule { }
