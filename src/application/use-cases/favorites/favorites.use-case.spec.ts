import { AddFavoriteUseCase, RemoveFavoriteUseCase, ListFavoritesUseCase, FavoriteAlreadyExistsError, FavoriteNotFoundError, PropertyNotFoundError } from './favorites.use-case';
import { Property, PropertyStatus, PropertyType } from '../../../domain/entities/property';
import { FavoriteRepository, Favorite } from '../../ports/favorite-repository';
import { PropertyRepository, PropertyFilters, CreatePropertyData, UpdatePropertyData } from '../../ports/property-repository';

// In-memory repositories for testing
class InMemoryFavoriteRepository implements FavoriteRepository {
  private favorites: Favorite[] = [];

  async findByUserAndProperty(userId: string, propertyId: string): Promise<Favorite | null> {
    return this.favorites.find((f) => f.userId === userId && f.propertyId === propertyId) || null;
  }

  async findByUser(userId: string): Promise<Favorite[]> {
    return this.favorites.filter((f) => f.userId === userId);
  }

  async add(userId: string, propertyId: string): Promise<Favorite> {
    const favorite: Favorite = {
      id: `favorite-${this.favorites.length + 1}`,
      userId,
      propertyId,
      createdAt: new Date(),
    };
    this.favorites.push(favorite);
    return favorite;
  }

  async remove(userId: string, propertyId: string): Promise<void> {
    const index = this.favorites.findIndex((f) => f.userId === userId && f.propertyId === propertyId);
    if (index >= 0) {
      this.favorites.splice(index, 1);
    }
  }

  async countByProperty(propertyId: string): Promise<number> {
    return this.favorites.filter((f) => f.propertyId === propertyId).length;
  }

  // Helper for tests
  addFavorite(favorite: Favorite): void {
    this.favorites.push(favorite);
  }
}

class InMemoryPropertyRepository implements PropertyRepository {
  private properties: Property[] = [];

  async findById(id: string): Promise<Property | null> {
    return this.properties.find((p) => p.id === id) || null;
  }

  async findAll(filters?: PropertyFilters): Promise<Property[]> {
    return this.properties;
  }

  async findByOwner(ownerId: string): Promise<Property[]> {
    return this.properties.filter((p) => p.ownerId === ownerId);
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.properties.filter((p) => p.ownerId === ownerId).length;
  }

  async create(data: CreatePropertyData): Promise<Property> {
    throw new Error('Not implemented');
  }

  async update(id: string, data: UpdatePropertyData): Promise<Property> {
    throw new Error('Not implemented');
  }

  async updateStatus(id: string, status: string): Promise<Property> {
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async hasConflictingBooking(): Promise<boolean> {
    return false;
  }

  addProperty(property: Property): void {
    this.properties.push(property);
  }
}

describe('Favorites Use Cases', () => {
  let favoriteRepository: InMemoryFavoriteRepository;
  let propertyRepository: InMemoryPropertyRepository;
  let testProperty: Property;

  beforeEach(() => {
    favoriteRepository = new InMemoryFavoriteRepository();
    propertyRepository = new InMemoryPropertyRepository();

    testProperty = new Property({
      id: 'property-1',
      ownerId: 'owner-1',
      title: 'Beach House',
      type: PropertyType.TEMPORADA,
      status: PropertyStatus.ATIVO,
      pricePerNight: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    propertyRepository.addProperty(testProperty);
  });

  describe('AddFavoriteUseCase', () => {
    let addFavoriteUseCase: AddFavoriteUseCase;

    beforeEach(() => {
      addFavoriteUseCase = new AddFavoriteUseCase(favoriteRepository, propertyRepository);
    });

    it('should add property to favorites', async () => {
      const favorite = await addFavoriteUseCase.execute({
        userId: 'user-1',
        propertyId: 'property-1',
      });

      expect(favorite.id).toBeDefined();
      expect(favorite.userId).toBe('user-1');
      expect(favorite.propertyId).toBe('property-1');
    });

    it('should throw PropertyNotFoundError if property does not exist', async () => {
      await expect(
        addFavoriteUseCase.execute({
          userId: 'user-1',
          propertyId: 'non-existent',
        }),
      ).rejects.toThrow(PropertyNotFoundError);
    });

    it('should throw FavoriteAlreadyExistsError if already favorited', async () => {
      // Add first time
      await addFavoriteUseCase.execute({
        userId: 'user-1',
        propertyId: 'property-1',
      });

      // Try to add again
      await expect(
        addFavoriteUseCase.execute({
          userId: 'user-1',
          propertyId: 'property-1',
        }),
      ).rejects.toThrow(FavoriteAlreadyExistsError);
    });

    it('should allow different users to favorite same property', async () => {
      await addFavoriteUseCase.execute({
        userId: 'user-1',
        propertyId: 'property-1',
      });

      const favorite2 = await addFavoriteUseCase.execute({
        userId: 'user-2',
        propertyId: 'property-1',
      });

      expect(favorite2.userId).toBe('user-2');
    });
  });

  describe('RemoveFavoriteUseCase', () => {
    let removeFavoriteUseCase: RemoveFavoriteUseCase;

    beforeEach(() => {
      removeFavoriteUseCase = new RemoveFavoriteUseCase(favoriteRepository);
    });

    it('should remove property from favorites', async () => {
      // Setup existing favorite
      favoriteRepository.addFavorite({
        id: 'fav-1',
        userId: 'user-1',
        propertyId: 'property-1',
        createdAt: new Date(),
      });

      await removeFavoriteUseCase.execute({
        userId: 'user-1',
        propertyId: 'property-1',
      });

      const remaining = await favoriteRepository.findByUser('user-1');
      expect(remaining).toHaveLength(0);
    });

    it('should throw FavoriteNotFoundError if not favorited', async () => {
      await expect(
        removeFavoriteUseCase.execute({
          userId: 'user-1',
          propertyId: 'property-1',
        }),
      ).rejects.toThrow(FavoriteNotFoundError);
    });
  });

  describe('ListFavoritesUseCase', () => {
    let listFavoritesUseCase: ListFavoritesUseCase;

    beforeEach(() => {
      listFavoritesUseCase = new ListFavoritesUseCase(favoriteRepository);
    });

    it('should list all user favorites', async () => {
      // Setup favorites
      favoriteRepository.addFavorite({
        id: 'fav-1',
        userId: 'user-1',
        propertyId: 'property-1',
        createdAt: new Date(),
      });
      favoriteRepository.addFavorite({
        id: 'fav-2',
        userId: 'user-1',
        propertyId: 'property-2',
        createdAt: new Date(),
      });
      favoriteRepository.addFavorite({
        id: 'fav-3',
        userId: 'user-2',
        propertyId: 'property-1',
        createdAt: new Date(),
      });

      const favorites = await listFavoritesUseCase.execute({ userId: 'user-1' });

      expect(favorites).toHaveLength(2);
      expect(favorites.every((f) => f.userId === 'user-1')).toBe(true);
    });

    it('should return empty array for user with no favorites', async () => {
      const favorites = await listFavoritesUseCase.execute({ userId: 'user-no-favorites' });
      expect(favorites).toHaveLength(0);
    });
  });
});
