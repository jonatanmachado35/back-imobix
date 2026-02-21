import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { CloudinaryModule } from '../infrastructure/file-storage/cloudinary/cloudinary.module';
import { PROPERTY_REPOSITORY } from './properties.tokens';
import { PrismaPropertyRepository } from '../infrastructure/database/prisma-property.repository';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreatePropertyUseCase } from '../application/use-cases/properties/create-property.use-case';
import { ListPropertiesUseCase } from '../application/use-cases/properties/list-properties.use-case';
import { GetPropertyUseCase } from '../application/use-cases/properties/get-property.use-case';
import { UpdatePropertyUseCase } from '../application/use-cases/properties/update-property.use-case';
import { UpdatePropertyStatusUseCase } from '../application/use-cases/properties/update-property-status.use-case';
import { ListOwnerPropertiesUseCase } from '../application/use-cases/properties/list-owner-properties.use-case';
import { PropertiesController } from '../interfaces/http/properties.controller';
import { ProprietarioController } from '../interfaces/http/proprietario.controller';
import { PropertyRepository } from '../application/ports/property-repository';
import { UploadPropertyImageUseCase } from '../application/use-cases/property-images/upload-property-image.use-case';
import { DeletePropertyImageUseCase } from '../application/use-cases/property-images/delete-property-image.use-case';
import { ListPropertyImagesUseCase } from '../application/use-cases/property-images/list-property-images.use-case';
import { SetPrimaryPropertyImageUseCase } from '../application/use-cases/property-images/set-primary-property-image.use-case';
import { ValidateImageFileUseCase } from '../application/use-cases/property-images/validate-image-file.use-case';

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  controllers: [PropertiesController, ProprietarioController],
  providers: [
    PrismaService,
    { provide: PROPERTY_REPOSITORY, useClass: PrismaPropertyRepository },
    {
      provide: CreatePropertyUseCase,
      useFactory: (repo: PropertyRepository) => new CreatePropertyUseCase(repo),
      inject: [PROPERTY_REPOSITORY],
    },
    {
      provide: ListPropertiesUseCase,
      useFactory: (repo: PropertyRepository) => new ListPropertiesUseCase(repo),
      inject: [PROPERTY_REPOSITORY],
    },
    {
      provide: GetPropertyUseCase,
      useFactory: (repo: PropertyRepository) => new GetPropertyUseCase(repo),
      inject: [PROPERTY_REPOSITORY],
    },
    {
      provide: UpdatePropertyUseCase,
      useFactory: (repo: PropertyRepository) => new UpdatePropertyUseCase(repo),
      inject: [PROPERTY_REPOSITORY],
    },
    {
      provide: UpdatePropertyStatusUseCase,
      useFactory: (repo: PropertyRepository) => new UpdatePropertyStatusUseCase(repo),
      inject: [PROPERTY_REPOSITORY],
    },
    {
      provide: ListOwnerPropertiesUseCase,
      useFactory: (repo: PropertyRepository) => new ListOwnerPropertiesUseCase(repo),
      inject: [PROPERTY_REPOSITORY],
    },
    UploadPropertyImageUseCase,
    DeletePropertyImageUseCase,
    ListPropertyImagesUseCase,
    SetPrimaryPropertyImageUseCase,
    ValidateImageFileUseCase,
  ],
  exports: [PROPERTY_REPOSITORY],
})
export class PropertiesModule { }
