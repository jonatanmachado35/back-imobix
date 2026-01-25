import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ 
    description: 'Token JWT para autenticação', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHh5ejEyMzQ1Njc4OSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNzg0MDAwMCwiZXhwIjoxNzM3OTI2NDAwfQ.signature' 
  })
  access_token: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ description: 'ID do usuário', example: 'clxyz123456789' })
  userId: string;

  @ApiProperty({ description: 'Email do usuário', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Role do usuário', example: 'ADMIN', enum: ['ADMIN', 'CORRETOR', 'FUNCIONARIO'] })
  role: string;
}
