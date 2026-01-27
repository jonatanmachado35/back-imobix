import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsInt, IsArray, IsOptional, Min } from 'class-validator';

export class CreateAnuncioDto {
  @ApiProperty({ description: 'Título do anúncio', example: 'Casa de Praia em Ubatuba - 3 quartos' })
  @IsString()
  titulo: string;

  @ApiProperty({ 
    description: 'Tipo de propriedade', 
    enum: ['CASA_PRAIA', 'APARTAMENTO_PRAIA', 'SITIO', 'CHACARA', 'CASA_CAMPO', 'COBERTURA', 'OUTRO'],
    example: 'CASA_PRAIA'
  })
  @IsEnum(['CASA_PRAIA', 'APARTAMENTO_PRAIA', 'SITIO', 'CHACARA', 'CASA_CAMPO', 'COBERTURA', 'OUTRO'])
  tipo: string;

  @ApiProperty({ description: 'Endereço completo', example: 'Rua das Flores, 123' })
  @IsString()
  endereco: string;

  @ApiProperty({ description: 'Cidade', example: 'Ubatuba' })
  @IsString()
  cidade: string;

  @ApiProperty({ description: 'Estado (sigla)', example: 'SP' })
  @IsString()
  estado: string;

  @ApiProperty({ description: 'Valor da diária em dias de semana', example: 350.00 })
  @IsNumber()
  @Min(0)
  valorDiaria: number;

  @ApiProperty({ description: 'Valor da diária em finais de semana', example: 450.00 })
  @IsNumber()
  @Min(0)
  valorDiariaFimSemana: number;

  @ApiProperty({ description: 'Nome do proprietário', example: 'João da Silva', required: false })
  @IsOptional()
  @IsString()
  proprietario?: string;

  @ApiProperty({ description: 'Capacidade de hóspedes', example: 6 })
  @IsInt()
  @Min(1)
  capacidadeHospedes: number;

  @ApiProperty({ description: 'Número de quartos', example: 3 })
  @IsInt()
  @Min(0)
  quartos: number;

  @ApiProperty({ description: 'Número de camas', example: 4 })
  @IsInt()
  @Min(0)
  camas: number;

  @ApiProperty({ description: 'Número de banheiros', example: 2 })
  @IsInt()
  @Min(0)
  banheiros: number;

  @ApiProperty({ description: 'Área total em m²', example: 150.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaTotal?: number;

  @ApiProperty({ description: 'Mínimo de noites para reserva', example: 2, default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  minimoNoites?: number;

  @ApiProperty({ 
    description: 'URLs das imagens do imóvel', 
    example: ['https://exemplo.com/img1.jpg', 'https://exemplo.com/img2.jpg'],
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagens?: string[];
}
