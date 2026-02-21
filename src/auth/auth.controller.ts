import { Controller, Request, Post, UseGuards, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto, RequestPasswordResetResponseDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Fazer login', description: 'Autentica usuário e retorna token JWT' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token', description: 'Gera novos tokens usando o refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens renovados' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout', description: 'Invalida o refresh token do usuário' })
  @ApiResponse({ status: 200, description: 'Logout realizado' })
  async logout(@Request() req) {
    return this.authService.logout(req.user.userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mudar senha',
    description: 'Usuário autenticado altera sua própria senha'
  })
  @ApiResponse({ status: 204, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 400, description: 'Senha atual incorreta ou nova senha inválida' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async changePassword(
    @Request() req,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(req.user.userId, dto);
  }

  @Post('admin/request-password-reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[ADMIN] Gerar token de reset de senha',
    description: 'Apenas admins podem gerar tokens de reset (versão simplificada sem email)'
  })
  @ApiResponse({
    status: 200,
    description: 'Token gerado com sucesso',
    type: RequestPasswordResetResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas admins)' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponseDto> {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Resetar senha com token',
    description: 'Redefine senha usando token gerado pelo admin (versão simplificada)'
  })
  @ApiResponse({ status: 204, description: 'Senha resetada com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido, expirado ou senha inválida' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto);
  }
}
