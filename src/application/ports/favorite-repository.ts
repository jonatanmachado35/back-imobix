export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: Date;
}

export interface FavoriteRepository {
  findByUserAndProperty(userId: string, propertyId: string): Promise<Favorite | null>;
  findByUser(userId: string): Promise<Favorite[]>;
  add(userId: string, propertyId: string): Promise<Favorite>;
  remove(userId: string, propertyId: string): Promise<void>;
  countByProperty(propertyId: string): Promise<number>;
}
