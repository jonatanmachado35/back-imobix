import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class RealEstateService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.anuncio.findMany({
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.anuncio.findUnique({
      where: { id },
      include: { images: true },
    });
  }

  async create(data: any) {
    return this.prisma.anuncio.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.anuncio.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: any) {
    return this.prisma.anuncio.update({ where: { id }, data: { status } });
  }
}
