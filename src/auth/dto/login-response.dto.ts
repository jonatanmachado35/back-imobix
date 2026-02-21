import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({ description: 'ID do usuário', example: 'clxyz123456789' })
  id: string;

  @ApiProperty({ description: 'Nome completo', example: 'Maria Silva' })
  nome: string;

  @ApiProperty({ description: 'Email', example: 'maria@example.com' })
  email: string;

  @ApiProperty({ 
    description: 'Permissão de sistema', 
    example: 'ADMIN', 
    enum: ['ADMIN', 'USER'] 
  })
  role: string;

  @ApiProperty({ 
    description: 'Tipo de usuário no negócio', 
    example: 'cliente', 
    enum: ['cliente', 'proprietario'] 
  })
  userType: string;
}

export class LoginResponseDto {
  @ApiProperty({ 
    description: 'Token JWT para autenticação', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHh5ejEyMzQ1Njc4OSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNzg0MDAwMCwiZXhwIjoxNzM3OTI2NDAwfQ.signature' 
  })
  access_token: string;

  @ApiProperty({ 
    description: 'Dados do usuário autenticado',
    type: UserInfoDto 
  })
  user: UserInfoDto;
}

export class UserProfileResponseDto {
  @ApiProperty({ description: 'ID do usuário', example: 'clxyz123456789' })
  userId: string;

  @ApiProperty({ description: 'Email do usuário', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Nome do usuário', example: 'Maria Silva' })
  nome: string;

  @ApiProperty({ 
    description: 'Permissão de sistema', 
    example: 'ADMIN', 
    enum: ['ADMIN', 'USER'] 
  })
  role: string;

  @ApiProperty({ 
    description: 'Tipo de usuário no negócio', 
    example: 'cliente', 
    enum: ['cliente', 'proprietario'] 
  })
  userType: string;
}
