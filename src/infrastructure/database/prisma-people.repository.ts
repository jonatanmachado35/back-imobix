import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PeopleRepository } from '../../application/ports/people-repository';
import { PrismaService } from '../database/prisma.service';
import { Funcionario, Corretor, User } from '@prisma/client';
import { EmailAlreadyExistsError } from '../../application/use-cases/user-errors';

@Injectable()
export class PrismaPeopleRepository implements PeopleRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Funcionarios
  async findAllFuncionarios(tenantId?: string | null): Promise<(Funcionario & { user: User })[]> {
    // Filtra pelo tenant do usuário vinculado, a menos que seja SUPER_ADMIN (tenantId=null) (ADR-001)
    if (tenantId) {
      return (this.prisma.funcionario as any).findMany({
        where: { user: { tenantId } },
        include: { user: true },
      });
    }
    return this.prisma.funcionario.findMany({ 
      include: { user: true } 
    });
  }

  async findFuncionarioById(id: string): Promise<(Funcionario & { user: User }) | null> {
    return this.prisma.funcionario.findUnique({ 
      where: { id }, 
      include: { user: true } 
    });
  }

  async createFuncionario(data: {
    userId: string;
    cpf?: string;
    telefone?: string;
    status?: 'ATIVO' | 'INATIVO';
  }): Promise<Funcionario & { user: User }> {
    return this.prisma.funcionario.create({
      data: {
        userId: data.userId,
        cpf: data.cpf,
        telefone: data.telefone,
        status: data.status || 'ATIVO',
      },
      include: {
        user: true,
      },
    });
  }

  async createFuncionarioWithUser(data: {
    nome: string;
    email: string;
    passwordHash: string;
    cpf?: string;
    telefone?: string;
    status?: 'ATIVO' | 'INATIVO';
    tenantId?: string | null;
  }): Promise<Funcionario & { user: User }> {
    try {
      return await this.prisma.$transaction(async tx => {
        const user = await (tx.user as any).create({
          data: {
            nome: data.nome,
            email: data.email,
            passwordHash: data.passwordHash,
            role: 'USER',
            userRole: 'funcionario',
            tenantId: data.tenantId ?? null,
          }
        });

        const funcionario = await tx.funcionario.create({
          data: {
            userId: user.id,
            cpf: data.cpf,
            telefone: data.telefone,
            status: data.status || 'ATIVO',
          },
          include: {
            user: true,
          }
        });

        return funcionario;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new EmailAlreadyExistsError(data.email);
      }
      throw error;
    }
  }

  // Corretores
  async findAllCorretores(tenantId?: string | null): Promise<(Corretor & { user: User | null })[]> {
    if (tenantId) {
      return (this.prisma.corretor as any).findMany({
        where: { user: { tenantId } },
        include: { user: true },
      });
    }
    return this.prisma.corretor.findMany({ include: { user: true } });
  }

  async findCorretorById(id: string): Promise<(Corretor & { user: User | null }) | null> {
    return this.prisma.corretor.findUnique({ 
      where: { id }, 
      include: { user: true } 
    });
  }

  async createCorretor(data: any): Promise<Corretor> {
    return this.prisma.corretor.create({ data });
  }
}
