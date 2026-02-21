import { Funcionario, Corretor, User } from '@prisma/client';

export interface PeopleRepository {
  // Funcionarios
  findAllFuncionarios(): Promise<(Funcionario & { user: User })[]>;
  findFuncionarioById(id: string): Promise<(Funcionario & { user: User }) | null>;
  createFuncionario(data: {
    userId: string;
    cpf?: string;
    telefone?: string;
    status?: 'ATIVO' | 'INATIVO';
  }): Promise<Funcionario & { user: User }>;
  
  // Corretores
  findAllCorretores(): Promise<(Corretor & { user: User | null })[]>;
  findCorretorById(id: string): Promise<(Corretor & { user: User | null }) | null>;
  createCorretor(data: any): Promise<Corretor>;
}
