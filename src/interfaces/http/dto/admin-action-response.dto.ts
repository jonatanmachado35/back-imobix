import { ApiProperty } from '@nestjs/swagger';

export class AdminUserResponseDto {
  @ApiProperty({ description: 'ID do usuario', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome do usuario', example: 'Maria Silva' })
  nome: string;

  @ApiProperty({ description: 'Email do usuario', example: 'maria@example.com' })
  email: string;

  @ApiProperty({ description: 'Role de sistema', example: 'USER', enum: ['ADMIN', 'USER'] })
  role: string;

  @ApiProperty({ description: 'Tipo de usuario', example: 'cliente', enum: ['cliente', 'proprietario'] })
  userRole: string;

  @ApiProperty({ description: 'Status do usuario', example: 'active', enum: ['active', 'blocked'] })
  status: string;

  @ApiProperty({ description: 'Data de criacao' })
  createdAt: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class ListUsersResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto] })
  data: AdminUserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class AdminActionResponseDto {
  @ApiProperty({ description: 'ID do usuario', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome do usuario', example: 'Maria Silva' })
  nome: string;

  @ApiProperty({ description: 'Email do usuario', example: 'maria@example.com' })
  email: string;

  @ApiProperty({ description: 'Mensagem da acao', example: 'Usuario promovido a admin' })
  message: string;
}

export class PromoteResponseDto extends AdminActionResponseDto {
  @ApiProperty({ description: 'Nova role', example: 'ADMIN' })
  role: string;
}

export class BlockResponseDto extends AdminActionResponseDto {
  @ApiProperty({ description: 'Novo status', example: 'blocked' })
  status: string;
}

export class UnblockResponseDto extends AdminActionResponseDto {
  @ApiProperty({ description: 'Novo status', example: 'active' })
  status: string;
}
