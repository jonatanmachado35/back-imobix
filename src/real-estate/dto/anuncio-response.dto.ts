import { ApiProperty } from '@nestjs/swagger';

export class AnuncioResponseDto {
  @ApiProperty({ description: 'ID do anúncio', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Título do anúncio', example: 'Casa de Praia em Ubatuba - 3 quartos' })
  titulo: string;

  @ApiProperty({ 
    description: 'Tipo de propriedade', 
    enum: ['CASA_PRAIA', 'APARTAMENTO_PRAIA', 'SITIO', 'CHACARA', 'CASA_CAMPO', 'COBERTURA', 'OUTRO'],
    example: 'CASA_PRAIA'
  })
  tipo: string;

  @ApiProperty({ description: 'Endereço completo', example: 'Rua das Flores, 123' })
  endereco: string;

  @ApiProperty({ description: 'Cidade', example: 'Ubatuba' })
  cidade: string;

  @ApiProperty({ description: 'Estado (sigla)', example: 'SP' })
  estado: string;

  @ApiProperty({ description: 'Valor da diária em dias de semana', example: '350.00' })
  valorDiaria: string;

  @ApiProperty({ description: 'Valor da diária em finais de semana', example: '450.00' })
  valorDiariaFimSemana: string;

  @ApiProperty({ 
    description: 'Status do anúncio', 
    enum: ['AGUARDANDO_APROVACAO', 'ATIVO', 'INATIVO', 'REJEITADO'],
    example: 'ATIVO'
  })
  status: string;

  @ApiProperty({ description: 'Nome do proprietário', example: 'João da Silva', required: false })
  proprietario?: string;

  @ApiProperty({ description: 'Capacidade de hóspedes', example: 6 })
  capacidadeHospedes: number;

  @ApiProperty({ description: 'Número de quartos', example: 3 })
  quartos: number;

  @ApiProperty({ description: 'Número de camas', example: 4 })
  camas: number;

  @ApiProperty({ description: 'Número de banheiros', example: 2 })
  banheiros: number;

  @ApiProperty({ description: 'Área total em m²', example: 150.5, required: false })
  areaTotal?: number;

  @ApiProperty({ description: 'Mínimo de noites para reserva', example: 2 })
  minimoNoites: number;

  @ApiProperty({ description: 'Data de envio/criação', example: '2026-01-27T10:00:00.000Z' })
  dataEnvio: Date;

  @ApiProperty({ 
    description: 'URLs das imagens do imóvel', 
    example: ['https://exemplo.com/img1.jpg', 'https://exemplo.com/img2.jpg'],
    type: [String]
  })
  imagens: string[];

  @ApiProperty({ description: 'Data de última atualização', example: '2026-01-27T10:00:00.000Z' })
  updatedAt: Date;
}

export class UpdateAnuncioStatusDto {
  @ApiProperty({ 
    description: 'Novo status do anúncio', 
    enum: ['AGUARDANDO_APROVACAO', 'ATIVO', 'INATIVO', 'REJEITADO'],
    example: 'ATIVO'
  })
  status: string;
}
