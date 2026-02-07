import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Favorite, FavoriteRepository } from '../../application/ports/favorite-repository';

@Injectable()
export class PrismaFavoriteRepository implements FavoriteRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByUserAndProperty(userId: string, propertyId: string): Promise<Favorite | null> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_propertyId: { userId, propertyId },
      },
    });
    return favorite;
  }

  async findByUser(userId: string): Promise<Favorite[]> {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: string, propertyId: string): Promise<Favorite> {
    return this.prisma.favorite.create({
      data: { userId, propertyId },
    });
  }

  async remove(userId: string, propertyId: string): Promise<void> {
    await this.prisma.favorite.delete({
      where: {
        userId_propertyId: { userId, propertyId },
      },
    });
  }

  async countByProperty(propertyId: string): Promise<number> {
    return this.prisma.favorite.count({
      where: { propertyId },
    });
  }
}
