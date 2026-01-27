import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({ description: 'ID da transação', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Descrição da transação', example: 'Reserva - Casa de Praia Ubatuba' })
  descricao: string;

  @ApiProperty({ 
    description: 'Categoria da transação', 
    enum: ['RESERVA', 'COMISSAO_CORRETOR', 'PAGAMENTO_PROPRIETARIO', 'TAXA_PLATAFORMA', 'CANCELAMENTO', 'TAXA_LIMPEZA', 'TAXA_SERVICO', 'OUTRO'],
    example: 'RESERVA'
  })
  categoria: string;

  @ApiProperty({ 
    description: 'Tipo da transação', 
    enum: ['ENTRADA', 'SAIDA'],
    example: 'ENTRADA'
  })
  tipo: string;

  @ApiProperty({ description: 'Valor da transação', example: '2500.00' })
  valor: string;

  @ApiProperty({ 
    description: 'Status da transação', 
    enum: ['PAGO', 'PENDENTE', 'CANCELADO', 'PROCESSANDO'],
    example: 'PAGO'
  })
  status: string;

  @ApiProperty({ description: 'Data da transação', example: '2026-01-27T10:00:00.000Z' })
  data: Date;

  @ApiProperty({ description: 'Data de vencimento', example: '2026-02-27T10:00:00.000Z', required: false })
  dataVencimento?: Date;

  @ApiProperty({ description: 'Método de pagamento', example: 'PIX', required: false })
  metodoPagamento?: string;

  @ApiProperty({ description: 'ID da propriedade relacionada', example: 'clxyz123456789', required: false })
  propriedadeId?: string;

  @ApiProperty({ description: 'ID do corretor relacionado', example: 'clxyz123456789', required: false })
  corretorId?: string;

  @ApiProperty({ description: 'ID do hóspede relacionado', example: 'clxyz123456789', required: false })
  hospedeId?: string;
}

export class FinanceSummaryResponseDto {
  @ApiProperty({ description: 'Total de receitas', example: '125000.50' })
  totalReceitas: string;

  @ApiProperty({ description: 'Total de despesas', example: '45000.00' })
  totalDespesas: string;

  @ApiProperty({ description: 'Saldo atual', example: '80000.50' })
  saldo: string;

  @ApiProperty({ description: 'Total de transações pendentes', example: 12 })
  transacoesPendentes: number;

  @ApiProperty({ description: 'Período de referência', example: 'Janeiro/2026', required: false })
  periodo?: string;
}
