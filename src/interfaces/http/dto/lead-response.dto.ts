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

export class ImportErrorDto {
  @ApiProperty({ description: 'Número da linha no CSV onde ocorreu o erro', example: 3 })
  row: number;

  @ApiProperty({ description: 'Dados da linha que causou o erro', example: { nome: 'João Silva', email: 'joao@example.com' } })
  data: Record<string, any>;

  @ApiProperty({ description: 'Mensagem de erro descritiva', example: 'Email já cadastrado no sistema' })
  error: string;
}

export class ImportLeadsResponseDto {
  @ApiProperty({ description: 'Total de registros processados', example: 100 })
  totalProcessed: number;

  @ApiProperty({ description: 'Número de leads importados com sucesso', example: 95 })
  successCount: number;

  @ApiProperty({ description: 'Número de registros com erro', example: 5 })
  errorCount: number;

  @ApiProperty({ description: 'Lista detalhada de erros encontrados', type: [ImportErrorDto] })
  errors: ImportErrorDto[];

  @ApiProperty({ description: 'Mensagem de conclusão', example: 'Importação concluída: 95 leads cadastrados com sucesso, 5 erros encontrados.' })
  message: string;
}
