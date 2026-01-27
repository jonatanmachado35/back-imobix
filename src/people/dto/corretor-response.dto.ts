import { ApiProperty } from '@nestjs/swagger';

export class CorretorResponseDto {
  @ApiProperty({ description: 'ID do corretor', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome completo do corretor', example: 'Carlos Eduardo Silva' })
  nome: string;

  @ApiProperty({ description: 'Número CRECI do corretor', example: 'F12345', required: false })
  creci?: string;

  @ApiProperty({ description: 'Total de vendas realizadas', example: 15, default: 0 })
  totalVendas: number;

  @ApiProperty({ description: 'Especialidade do corretor', example: 'Imóveis de alto padrão', required: false })
  especialidade?: string;

  @ApiProperty({ description: 'Comissão total acumulada', example: '125000.50', required: false })
  comissaoTotal?: string;

  @ApiProperty({ description: 'ID do usuário vinculado', example: 'clxyz123456789', required: false })
  userId?: string;

  @ApiProperty({ description: 'Data de criação', example: '2026-01-27T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de última atualização', example: '2026-01-27T10:00:00.000Z' })
  updatedAt: Date;
}
