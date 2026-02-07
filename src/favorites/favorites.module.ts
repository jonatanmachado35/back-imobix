import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PrismaFavoriteRepository } from '../infrastructure/database/prisma-favorite.repository';
import { PrismaPropertyRepository } from '../infrastructure/database/prisma-property.repository';
import { FavoriteRepository } from '../application/ports/favorite-repository';
import { PropertyRepository } from '../application/ports/property-repository';
import {
  AddFavoriteUseCase,
  RemoveFavoriteUseCase,
  ListFavoritesUseCase,
} from '../application/use-cases/favorites/favorites.use-case';
import { FavoritesController } from '../interfaces/http/favorites.controller';

export const FAVORITE_REPOSITORY = Symbol('FAVORITE_REPOSITORY');
const PROPERTY_REPOSITORY = Symbol('PROPERTY_REPOSITORY');

@Module({
  imports: [DatabaseModule],
  controllers: [FavoritesController],
  providers: [
    PrismaService,
    { provide: FAVORITE_REPOSITORY, useClass: PrismaFavoriteRepository },
    { provide: PROPERTY_REPOSITORY, useClass: PrismaPropertyRepository },
    {
      provide: AddFavoriteUseCase,
      useFactory: (favoriteRepo: FavoriteRepository, propertyRepo: PropertyRepository) =>
        new AddFavoriteUseCase(favoriteRepo, propertyRepo),
      inject: [FAVORITE_REPOSITORY, PROPERTY_REPOSITORY],
    },
    {
      provide: RemoveFavoriteUseCase,
      useFactory: (favoriteRepo: FavoriteRepository) => new RemoveFavoriteUseCase(favoriteRepo),
      inject: [FAVORITE_REPOSITORY],
    },
    {
      provide: ListFavoritesUseCase,
      useFactory: (favoriteRepo: FavoriteRepository) => new ListFavoritesUseCase(favoriteRepo),
      inject: [FAVORITE_REPOSITORY],
    },
  ],
  exports: [FAVORITE_REPOSITORY],
})
export class FavoritesModule { }
