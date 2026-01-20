import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('financeiro')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) { }

  @Get('transacoes')
  findAll(@Query() query: any) {
    return this.financeService.findAll(query);
  }

  @Get('resumo')
  getSummary() {
    return this.financeService.getSummary();
  }
}
