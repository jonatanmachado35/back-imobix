import { Injectable } from '@nestjs/common';
import { FinanceRepository } from '../../application/ports/finance-repository';
import { PrismaService } from '../database/prisma.service';
import { Transacao } from '@prisma/client';

@Injectable()
export class PrismaFinanceRepository implements FinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: any): Promise<Transacao[]> {
    return this.prisma.transacao.findMany();
  }

  async findResumo(): Promise<{
    receitas: number;
    despesas: number;
    saldo: number;
  }> {
    const entrada = await this.prisma.transacao.aggregate({
      _sum: { valor: true },
      where: { tipo: 'ENTRADA', status: 'PAGO' }
    });
    
    const saida = await this.prisma.transacao.aggregate({
      _sum: { valor: true },
      where: { tipo: 'SAIDA', status: 'PAGO' }
    });

    return {
      receitas: Number(entrada._sum.valor || 0),
      despesas: Number(saida._sum.valor || 0),
      saldo: (Number(entrada._sum.valor || 0) - Number(saida._sum.valor || 0))
    };
  }
}
