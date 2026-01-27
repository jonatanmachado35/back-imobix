import { ApiProperty } from '@nestjs/swagger';

export class FuncionarioResponseDto {
  @ApiProperty({ description: 'ID do funcionário', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome completo do funcionário', example: 'Maria Santos' })
  nome: string;

  @ApiProperty({ description: 'Email do funcionário', example: 'maria.santos@imobix.com' })
  email: string;

  @ApiProperty({ description: 'CPF do funcionário', example: '987.654.321-00', required: false })
  cpf?: string;

  @ApiProperty({ description: 'Telefone do funcionário', example: '(11) 91234-5678', required: false })
  telefone?: string;

  @ApiProperty({ description: 'Role do usuário', example: 'USER', enum: ['ADMIN', 'USER'] })
  role: string;

  @ApiProperty({ 
    description: 'Status do funcionário', 
    enum: ['ATIVO', 'INATIVO'], 
    example: 'ATIVO' 
  })
  status: string;

  @ApiProperty({ description: 'Data de cadastro', example: '2026-01-27T13:14:48.000Z' })
  dataCadastro: Date;

  @ApiProperty({ description: 'Endereço do funcionário', example: 'Rua das Flores, 123', required: false })
  endereco?: string;

  @ApiProperty({ description: 'Departamento do funcionário', example: 'TI', required: false })
  departamento?: string;
}

export class FuncionarioApiResponseDto {
  @ApiProperty({ description: 'Dados do funcionário criado', type: FuncionarioResponseDto })
  data: FuncionarioResponseDto;

  @ApiProperty({ description: 'Mensagem de sucesso', example: 'Funcionário criado com sucesso' })
  message: string;

  @ApiProperty({ description: 'Status da operação', example: true })
  success: boolean;
}
