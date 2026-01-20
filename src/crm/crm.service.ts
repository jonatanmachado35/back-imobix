import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.lead.findMany();
  }

  async findOne(id: string) {
    return this.prisma.lead.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.lead.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.lead.update({ where: { id }, data });
  }
}
