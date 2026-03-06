import { Funcionario, Corretor, User } from '@prisma/client';

export interface PeopleRepository {
  // Funcionarios
  /** tenantId=null → SUPER_ADMIN vê todos; tenantId definido → filtra pelo tenant (ADR-001) */
  findAllFuncionarios(tenantId?: string | null): Promise<(Funcionario & { user: User })[]>;
  findFuncionarioById(id: string): Promise<(Funcionario & { user: User }) | null>;
  createFuncionarioWithUser(data: {
    nome: string;
    email: string;
    passwordHash: string;
    cpf?: string;
    telefone?: string;
    status?: 'ATIVO' | 'INATIVO';
    /** tenantId do admin que está criando o funcionário (ADR-001) */
    tenantId?: string | null;
  }): Promise<Funcionario & { user: User }>
  createFuncionario(data: {
    userId: string;
    cpf?: string;
    telefone?: string;
    status?: 'ATIVO' | 'INATIVO';
  }): Promise<Funcionario & { user: User }>;
  
  // Corretores
  /** tenantId=null → SUPER_ADMIN vê todos; tenantId definido → filtra pelo tenant (ADR-001) */
  findAllCorretores(tenantId?: string | null): Promise<(Corretor & { user: User | null })[]>;
  findCorretorById(id: string): Promise<(Corretor & { user: User | null }) | null>;
  createCorretor(data: any): Promise<Corretor>;
}
