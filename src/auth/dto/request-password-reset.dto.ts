import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}

export class RequestPasswordResetResponseDto {
  @ApiProperty({
    description: 'Token de reset (temporário - até implementar envio de email)',
    example: 'abc123def456...',
  })
  resetToken: string;

  @ApiProperty({
    description: 'Data de expiração do token',
    example: '2026-02-13T15:30:00Z',
  })
  expiresAt: Date;
}
