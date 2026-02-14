import {
  Controller,
  Delete,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  UploadUserAvatarUseCase,
  UserNotFoundError,
} from '../../application/use-cases/user-avatar/upload-user-avatar.use-case';
import { DeleteUserAvatarUseCase } from '../../application/use-cases/user-avatar/delete-user-avatar.use-case';

@ApiTags('Usuários - Avatar')
@Controller('users/me/avatar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserAvatarController {
  constructor(
    private readonly uploadAvatar: UploadUserAvatarUseCase,
    private readonly deleteAvatar: DeleteUserAvatarUseCase,
  ) { }

  @Post()
  @ApiOperation({
    summary: 'Upload de avatar do usuário',
    description:
      'Envia imagem de perfil (JPG/PNG). Substitui avatar anterior se existir.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPG/PNG)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Avatar uploaded',
    schema: {
      properties: { avatarUrl: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou ausente' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @UseInterceptors(FileInterceptor('avatar'))
  async upload(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    // Validação de tipo (Cloudinary já valida, mas melhor falhar cedo)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG/PNG images allowed');
    }

    try {
      return await this.uploadAvatar.execute({
        userId: req.user.userId,
        file,
      });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove avatar do usuário',
    description: 'Deleta imagem do Cloudinary e limpa campo no banco',
  })
  @ApiResponse({ status: 204, description: 'Avatar removido' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async delete(@Request() req) {
    try {
      await this.deleteAvatar.execute(req.user.userId);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
