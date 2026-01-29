import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateCorretorDto {
  @ApiProperty({ description: 'Nome completo do corretor', example: 'Carlos Eduardo Silva', required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ description: 'Número CRECI do corretor', example: 'F12345', required: false })
  @IsOptional()
  @IsString()
  creci?: string;

  @ApiProperty({ description: 'CPF do corretor', example: '123.456.789-00', required: false })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ description: 'RG do corretor', example: '12.345.678-9', required: false })
  @IsOptional()
  @IsString()
  rg?: string;

  @ApiProperty({ description: 'Telefone do corretor', example: '(11) 98765-4321', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ 
    description: 'Sexo do corretor', 
    enum: ['MASCULINO', 'FEMININO', 'OUTRO', 'PREFIRO_NAO_INFORMAR'],
    example: 'MASCULINO',
    required: false 
  })
  @IsOptional()
  @IsEnum(['MASCULINO', 'FEMININO', 'OUTRO', 'PREFIRO_NAO_INFORMAR'])
  sexo?: 'MASCULINO' | 'FEMININO' | 'OUTRO' | 'PREFIRO_NAO_INFORMAR';

  @ApiProperty({ description: 'Endereço completo do corretor', example: 'Rua das Palmeiras, 456 - Centro', required: false })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiProperty({ description: 'Cidade do corretor', example: 'São Paulo', required: false })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiProperty({ description: 'Estado do corretor', example: 'SP', required: false })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiProperty({ description: 'CEP do corretor', example: '01234-567', required: false })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiProperty({ description: 'Especialidade do corretor', example: 'Imóveis de alto padrão', required: false })
  @IsOptional()
  @IsString()
  especialidade?: string;
}
