import { ApiProperty } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty({ description: 'ID do evento', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Tipo de evento', example: 'Visita Agendada' })
  tipo: string;

  @ApiProperty({ description: 'Título do evento', example: 'Visita - Casa de Praia Ubatuba' })
  titulo: string;

  @ApiProperty({ description: 'Data e hora do evento', example: '2026-02-15T14:00:00.000Z' })
  data: Date;

  @ApiProperty({ description: 'Descrição do evento', example: 'Cliente João Silva interessado em visitar o imóvel', required: false })
  descricao?: string;

  @ApiProperty({ description: 'ID do corretor responsável', example: 'clxyz123456789', required: false })
  corretorId?: string;

  @ApiProperty({ description: 'Nome do corretor responsável', example: 'Carlos Eduardo Silva', required: false })
  corretorNome?: string;

  @ApiProperty({ 
    description: 'Status do evento', 
    enum: ['AGENDADA', 'REALIZADA', 'CANCELADA'],
    example: 'AGENDADA' 
  })
  status: string;
}
