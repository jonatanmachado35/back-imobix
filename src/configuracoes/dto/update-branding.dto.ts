import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBrandingDto {
  @ApiProperty({
    required: false,
    example: 'Imobiliária Beira Mar',
    description: 'Nome exibido no painel',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nomePainel?: string;

  @ApiProperty({
    required: false,
    example: 'Aluguel por temporada',
    description: 'Subtítulo exibido no painel',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subtitulo?: string;

  @ApiProperty({
    required: false,
    example: '#2563EB',
    description: 'Cor primária em hexadecimal',
  })
  @IsOptional()
  @IsHexColor()
  corPrimaria?: string;

  @ApiProperty({
    required: false,
    example: '#1E3A5F',
    description: 'Cor da sidebar em hexadecimal',
  })
  @IsOptional()
  @IsHexColor()
  corSidebar?: string;
}
