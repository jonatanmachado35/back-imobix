import { Favorite, FavoriteRepository } from '../../ports/favorite-repository';
import { PropertyRepository } from '../../ports/property-repository';
import { ActivityRepository } from '../../ports/activity-repository';

export class PropertyNotFoundError extends Error {
  constructor(propertyId: string) {
    super(`Property not found: ${propertyId}`);
    this.name = 'PropertyNotFoundError';
  }
}

export class FavoriteAlreadyExistsError extends Error {
  constructor() {
    super('Property is already in favorites');
    this.name = 'FavoriteAlreadyExistsError';
  }
}

export class FavoriteNotFoundError extends Error {
  constructor() {
    super('Property is not in favorites');
    this.name = 'FavoriteNotFoundError';
  }
}

export interface AddFavoriteInput {
  userId: string;
  propertyId: string;
}

export class AddFavoriteUseCase {
  constructor(
    private readonly favoriteRepository: FavoriteRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly activityRepository?: ActivityRepository,
  ) { }

  async execute(input: AddFavoriteInput): Promise<Favorite> {
    // 1. Verify property exists
    const property = await this.propertyRepository.findById(input.propertyId);
    if (!property) {
      throw new PropertyNotFoundError(input.propertyId);
    }

    // 2. Check if already favorited
    const existing = await this.favoriteRepository.findByUserAndProperty(
      input.userId,
      input.propertyId,
    );
    if (existing) {
      throw new FavoriteAlreadyExistsError();
    }

    // 3. Add favorite
    const favorite = await this.favoriteRepository.add(input.userId, input.propertyId);

    // 4. Create activity
    if (this.activityRepository) {
      await this.activityRepository.create({
        userId: input.userId,
        type: 'FAVORITO_ADICIONADO',
        title: 'Imóvel favoritado',
        description: property.title,
        propertyId: input.propertyId,
      });
    }

    return favorite;
  }
}

export interface RemoveFavoriteInput {
  userId: string;
  propertyId: string;
}

export class RemoveFavoriteUseCase {
  constructor(
    private readonly favoriteRepository: FavoriteRepository,
    private readonly activityRepository?: ActivityRepository,
  ) { }

  async execute(input: RemoveFavoriteInput): Promise<void> {
    // 1. Check if favorited
    const existing = await this.favoriteRepository.findByUserAndProperty(
      input.userId,
      input.propertyId,
    );
    if (!existing) {
      throw new FavoriteNotFoundError();
    }

    // 2. Remove favorite
    await this.favoriteRepository.remove(input.userId, input.propertyId);

    // 3. Create activity
    if (this.activityRepository) {
      await this.activityRepository.create({
        userId: input.userId,
        type: 'FAVORITO_REMOVIDO',
        title: 'Imóvel removido dos favoritos',
        propertyId: input.propertyId,
      });
    }
  }
}

export interface ListFavoritesInput {
  userId: string;
}

export class ListFavoritesUseCase {
  constructor(private readonly favoriteRepository: FavoriteRepository) { }

  async execute(input: ListFavoritesInput): Promise<Favorite[]> {
    return this.favoriteRepository.findByUser(input.userId);
  }
}
