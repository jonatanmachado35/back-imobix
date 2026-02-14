import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de reset recebido',
    example: 'abc123def456...',
  })
  @IsString()
  resetToken: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 8 caracteres, com letras e números)',
    example: 'NewSecurePassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
