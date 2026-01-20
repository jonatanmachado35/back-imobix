import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class PeopleService {
  constructor(private prisma: PrismaService) { }

  // Funcionarios
  async findAllFuncionarios() {
    return this.prisma.funcionario.findMany({ include: { user: true } });
  }

  async findFuncionario(id: string) {
    return this.prisma.funcionario.findUnique({ where: { id }, include: { user: true } });
  }

  async createFuncionario(data: any) {
    // Handling creation would require creating User first or linking. 
    // For simplicity assuming data contains userId or we create User here.
    // This is a placeholder implementation.
    return this.prisma.funcionario.create({ data });
  }

  // Corretores
  async findAllCorretores() {
    return this.prisma.corretor.findMany({ include: { user: true } });
  }

  async findCorretor(id: string) {
    return this.prisma.corretor.findUnique({ where: { id }, include: { user: true } });
  }

  async createCorretor(data: any) {
    return this.prisma.corretor.create({ data });
  }
}
