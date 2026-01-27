import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { TransactionResponseDto, FinanceSummaryResponseDto } from './dto/finance-response.dto';

@ApiTags('Financeiro')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financeiro')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) { }

  @Get('transacoes')
  @ApiOperation({ summary: 'Listar transações financeiras', description: 'Retorna lista de transações com filtros opcionais' })
  @ApiResponse({ status: 200, description: 'Lista de transações retornada com sucesso', type: [TransactionResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@Query() query: TransactionQueryDto) {
    return this.financeService.findAll(query);
  }

  @Get('resumo')
  @ApiOperation({ summary: 'Obter resumo financeiro', description: 'Retorna resumo com totais de receitas, despesas e saldo' })
  @ApiResponse({ status: 200, description: 'Resumo financeiro retornado com sucesso', type: FinanceSummaryResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getSummary() {
    return this.financeService.getSummary();
  }
}
