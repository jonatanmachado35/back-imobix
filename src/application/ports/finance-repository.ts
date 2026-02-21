import { Transacao } from '@prisma/client';

export interface FinanceRepository {
  findAll(filters?: any): Promise<Transacao[]>;
  findResumo(): Promise<{
    receitas: number;
    despesas: number;
    saldo: number;
  }>;
}
