import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PasswordHasher } from '../application/ports/password-hasher';
import { Inject } from '@nestjs/common';
import { USER_REPOSITORY, PASSWORD_HASHER } from '../users/users.tokens';

@Injectable()
export class PeopleService {
  constructor(
    private prisma: PrismaService,
    @Inject(PASSWORD_HASHER) private passwordHasher: PasswordHasher
  ) { }

  // Funcionarios
  async findAllFuncionarios() {
    const funcionarios = await this.prisma.funcionario.findMany({ 
      include: { user: true } 
    });

    return funcionarios.map(funcionario => ({
      id: funcionario.id,
      nome: funcionario.user.nome,
      email: funcionario.user.email,
      cpf: funcionario.cpf,
      telefone: funcionario.telefone,
      role: funcionario.user.role,
      status: funcionario.status,
      dataCadastro: funcionario.dataCadastro,
      endereco: null,
      departamento: null
    }));
  }

  async findFuncionario(id: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ 
      where: { id }, 
      include: { user: true } 
    });

    if (!funcionario) {
      return null;
    }

    return {
      id: funcionario.id,
      nome: funcionario.user.nome,
      email: funcionario.user.email,
      cpf: funcionario.cpf,
      telefone: funcionario.telefone,
      role: funcionario.user.role,
      status: funcionario.status,
      dataCadastro: funcionario.dataCadastro,
      endereco: null,
      departamento: null
    };
  }

  async createFuncionario(data: { 
    nome: string; 
    email: string; 
    password: string;
    cpf?: string;
    telefone?: string;
    status?: 'ATIVO' | 'INATIVO';
    endereco?: string;
    departamento?: string;
  }) {
    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({ 
      where: { email: data.email } 
    });
    
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const passwordHash = await this.passwordHasher.hash(data.password);

    // Criar User e Funcionario em uma transação
    const funcionario = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nome: data.nome,
          email: data.email,
          passwordHash,
          role: 'USER'
        }
      });

      return tx.funcionario.create({
        data: {
          userId: user.id,
          cpf: data.cpf,
          telefone: data.telefone,
          status: data.status || 'ATIVO'
        },
        include: {
          user: true
        }
      });
    });

    return {
      data: {
        id: funcionario.id,
        nome: funcionario.user.nome,
        email: funcionario.user.email,
        cpf: funcionario.cpf,
        telefone: funcionario.telefone,
        role: funcionario.user.role,
        status: funcionario.status,
        dataCadastro: funcionario.dataCadastro,
        endereco: data.endereco || null,
        departamento: data.departamento || null
      },
      message: 'Funcionário criado com sucesso',
      success: true
    };
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
