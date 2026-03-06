import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  /**
   * Aceita 'nome' (padrão PT) ou 'name' (compatibilidade retroativa) — ADR-006 seção 2.2
   */
  @ApiProperty({ required: false, example: 'João Silva', description: 'Nome do usuário (use "nome" — campo "name" aceito por compatibilidade)' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ required: false, example: 'João Silva', description: 'Alias de "nome" para compatibilidade retroativa' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({ 
    required: false, 
    example: false,
    description: 'Marcar onboarding como concluído. Enviar false após o admin completar o primeiro acesso.' 
  })
  @IsOptional()
  @IsBoolean()
  primeiroAcesso?: boolean;

  @ApiProperty({
    required: false,
    example: 'light',
    description: "Tema da interface. Valores aceitos: 'light', 'dark', 'system'.",
    enum: ['light', 'dark', 'system'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system'])
  tema?: string;
}
