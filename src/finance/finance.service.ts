import { Inject, Injectable } from '@nestjs/common';
import { FinanceRepository } from '../application/ports/finance-repository';
import { FINANCE_REPOSITORY } from './finance.tokens';

@Injectable()
export class FinanceService {
  constructor(
    @Inject(FINANCE_REPOSITORY) private readonly financeRepository: FinanceRepository,
  ) {}

  async findAll(filters: any) {
    return this.financeRepository.findAll(filters);
  }

  async getSummary() {
    return this.financeRepository.findResumo();
  }
}
