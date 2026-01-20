import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class RealEstateService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.propriedadeTemporada.findMany();
  }

  async findOne(id: string) {
    return this.prisma.propriedadeTemporada.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.propriedadeTemporada.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.propriedadeTemporada.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: any) {
    return this.prisma.propriedadeTemporada.update({ where: { id }, data: { status } });
  }
}
