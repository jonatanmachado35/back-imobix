import { ApiProperty } from '@nestjs/swagger';

export class FuncionarioResponseDto {
  @ApiProperty({ description: 'ID do funcionário', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'ID do usuário vinculado', example: 'clxyz123456789' })
  userId: string;

  @ApiProperty({ description: 'CPF do funcionário', example: '123.456.789-00', required: false })
  cpf?: string;

  @ApiProperty({ description: 'Telefone do funcionário', example: '11987654321', required: false })
  telefone?: string;

  @ApiProperty({ 
    description: 'Status do funcionário', 
    enum: ['ATIVO', 'INATIVO'], 
    example: 'ATIVO' 
  })
  status: string;

  @ApiProperty({ description: 'Data de cadastro', example: '2026-01-27T10:00:00.000Z' })
  dataCadastro: Date;
}
