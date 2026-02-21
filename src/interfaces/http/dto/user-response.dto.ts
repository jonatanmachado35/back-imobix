import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'ID do usuário', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome completo do usuário', example: 'Maria Silva' })
  nome: string;

  @ApiProperty({ description: 'Email do usuário', example: 'maria@example.com' })
  email: string;

  @ApiProperty({ 
    description: 'Permissão de sistema', 
    example: 'USER', 
    enum: ['ADMIN', 'USER'] 
  })
  role: string;

  @ApiProperty({ 
    description: 'Tipo de usuário no negócio', 
    example: 'cliente', 
    enum: ['cliente', 'proprietario'] 
  })
  userType: string;

  @ApiProperty({ description: 'Data de criação', example: '2026-01-25T18:00:00.000Z' })
  createdAt: Date;
}
