import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'OldPassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 8 caracteres, com letras e números)',
    example: 'NewPassword456',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
