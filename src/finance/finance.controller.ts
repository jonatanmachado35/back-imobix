import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Financeiro')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financeiro')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) { }

  @Get('transacoes')
  @ApiOperation({ summary: 'Listar transações financeiras', description: 'Retorna lista de transações com filtros opcionais' })
  @ApiQuery({ name: 'periodo', required: false, description: 'Período de filtro (mes/ano)' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Tipo de transação (entrada/saida)' })
  @ApiResponse({ status: 200, description: 'Lista de transações retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@Query() query: any) {
    return this.financeService.findAll(query);
  }

  @Get('resumo')
  @ApiOperation({ summary: 'Obter resumo financeiro', description: 'Retorna resumo com totais de receitas, despesas e saldo' })
  @ApiResponse({ status: 200, description: 'Resumo financeiro retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getSummary() {
    return this.financeService.getSummary();
  }
}
