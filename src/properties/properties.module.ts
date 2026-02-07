import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
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

@Module({
  imports: [DatabaseModule],
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
  ],
  exports: [PROPERTY_REPOSITORY],
})
export class PropertiesModule { }
