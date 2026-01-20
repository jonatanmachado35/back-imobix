import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) { }

  async findAll(filters: any) {
    // Implement filtering logic here based on 'filters'
    // For now returning all for simplicity
    return this.prisma.transacao.findMany();
  }

  async getSummary() {
    // Aggregate calculations
    const entrada = await this.prisma.transacao.aggregate({
      _sum: { valor: true },
      where: { tipo: 'ENTRADA', status: 'PAGO' }
    });
    const saida = await this.prisma.transacao.aggregate({
      _sum: { valor: true },
      where: { tipo: 'SAIDA', status: 'PAGO' } // Using PAGO for realized expenses
    });

    return {
      receitas: entrada._sum.valor || 0,
      despesas: saida._sum.valor || 0,
      saldo: (Number(entrada._sum.valor || 0) - Number(saida._sum.valor || 0))
    };
  }
}
