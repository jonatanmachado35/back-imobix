import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';

export class TransactionQueryDto {
  @ApiProperty({ 
    description: 'Filtrar por período (formato: MM/YYYY)', 
    example: '01/2026',
    required: false 
  })
  @IsOptional()
  @IsString()
  periodo?: string;

  @ApiProperty({ 
    description: 'Filtrar por tipo de transação', 
    enum: ['ENTRADA', 'SAIDA'],
    example: 'ENTRADA',
    required: false 
  })
  @IsOptional()
  @IsEnum(['ENTRADA', 'SAIDA'])
  tipo?: 'ENTRADA' | 'SAIDA';

  @ApiProperty({ 
    description: 'Filtrar por categoria', 
    enum: ['RESERVA', 'COMISSAO_CORRETOR', 'PAGAMENTO_PROPRIETARIO', 'TAXA_PLATAFORMA', 'CANCELAMENTO', 'TAXA_LIMPEZA', 'TAXA_SERVICO', 'OUTRO'],
    example: 'RESERVA',
    required: false 
  })
  @IsOptional()
  @IsEnum(['RESERVA', 'COMISSAO_CORRETOR', 'PAGAMENTO_PROPRIETARIO', 'TAXA_PLATAFORMA', 'CANCELAMENTO', 'TAXA_LIMPEZA', 'TAXA_SERVICO', 'OUTRO'])
  categoria?: string;

  @ApiProperty({ 
    description: 'Filtrar por status', 
    enum: ['PAGO', 'PENDENTE', 'CANCELADO', 'PROCESSANDO'],
    example: 'PAGO',
    required: false 
  })
  @IsOptional()
  @IsEnum(['PAGO', 'PENDENTE', 'CANCELADO', 'PROCESSANDO'])
  status?: string;
}
