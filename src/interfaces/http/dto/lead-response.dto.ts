import { ApiProperty } from '@nestjs/swagger';

export class LeadResponseDto {
  @ApiProperty({ description: 'ID do lead', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome do lead', example: 'João Silva' })
  nome: string;

  @ApiProperty({ description: 'Email do lead', example: 'joao@example.com' })
  email: string;

  @ApiProperty({ description: 'Telefone do lead', example: '11999999999', required: false })
  telefone?: string;

  @ApiProperty({ description: 'Origem do lead', example: 'Website', required: false })
  origem?: string;

  @ApiProperty({ description: 'Interesse do lead', example: 'Apartamento 2 quartos', required: false })
  interesse?: string;

  @ApiProperty({ description: 'Status do lead', example: 'NOVO', enum: ['NOVO', 'CONTATADO', 'QUALIFICADO', 'CONVERTIDO', 'PERDIDO'] })
  status: string;

  @ApiProperty({ description: 'Anotações sobre o lead', example: 'Cliente interessado em zona sul', required: false })
  anotacoes?: string;

  @ApiProperty({ description: 'Data do primeiro contato', example: '2026-01-25T18:00:00.000Z', required: false })
  dataContato?: Date;

  @ApiProperty({ description: 'Data da última atualização', example: '2026-01-25T18:00:00.000Z' })
  updatedAt: Date;
}

export class LeadStatusResponseDto {
  @ApiProperty({ description: 'ID do lead', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Status atualizado do lead', example: 'QUALIFICADO', enum: ['NOVO', 'CONTATADO', 'QUALIFICADO', 'CONVERTIDO', 'PERDIDO'] })
  status: string;

  @ApiProperty({ description: 'Data da atualização', example: '2026-01-25T18:00:00.000Z' })
  updatedAt: Date;
}

export class LeadListResponseDto {
  @ApiProperty({ description: 'ID do lead', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome do lead', example: 'João Silva' })
  nome: string;

  @ApiProperty({ description: 'Email do lead', example: 'joao@example.com' })
  email: string;

  @ApiProperty({ description: 'Telefone do lead', example: '11999999999', required: false })
  telefone?: string;

  @ApiProperty({ description: 'Origem do lead', example: 'Website', required: false })
  origem?: string;

  @ApiProperty({ description: 'Interesse do lead', example: 'Apartamento 2 quartos', required: false })
  interesse?: string;

  @ApiProperty({ description: 'Status do lead', example: 'NOVO', enum: ['NOVO', 'CONTATADO', 'QUALIFICADO', 'CONVERTIDO', 'PERDIDO'] })
  status: string;

  @ApiProperty({ description: 'Data do primeiro contato', example: '2026-01-25T18:00:00.000Z', required: false })
  dataContato?: Date;
}
