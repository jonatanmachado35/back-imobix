import { UserRepository } from '../../ports/user-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export interface UploadUserAvatarInput {
  userId: string;
  file: Express.Multer.File;
}

export interface UploadUserAvatarOutput {
  avatarUrl: string;
}

export class UploadUserAvatarUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileStorageService: IFileStorageService,
  ) { }

  async execute(input: UploadUserAvatarInput): Promise<UploadUserAvatarOutput> {
    // 1. Verificar se usuário existe
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    // 2. Se já tem avatar, deletar o antigo do Cloudinary
    if (user.avatar) {
      // Extrair publicId da URL do Cloudinary
      const publicId = this.extractPublicIdFromUrl(user.avatar);
      await this.fileStorageService.delete(publicId);
    }

    // 3. Upload para Cloudinary (pasta "avatars")
    const uploadResult = await this.fileStorageService.upload(
      {
        buffer: input.file.buffer,
        mimetype: input.file.mimetype,
        originalname: input.file.originalname,
        size: input.file.size,
      },
      'avatars',
    );

    // 4. Atualizar entidade e persistir
    const updatedUser = await this.userRepository.update(input.userId, {
      avatar: uploadResult.secureUrl,
    });

    return { avatarUrl: updatedUser.avatar! };
  }

  /**
   * Extrai o publicId de uma URL do Cloudinary
   * Exemplo: https://res.cloudinary.com/cloud/image/upload/v123/avatars/user-123.jpg
   * Retorna: avatars/user-123
   */
  private extractPublicIdFromUrl(url: string): string {
    try {
      // Remove a extensão do arquivo
      const urlWithoutExtension = url.substring(0, url.lastIndexOf('.'));

      // Encontra o índice após "/upload/" ou "/upload/vXXX/"
      let uploadIndex = urlWithoutExtension.indexOf('/upload/');

      // Se não encontrar /upload/, tenta pegar a última parte da URL
      // Isso cobre casos como "https://cloudinary.com/avatars/old-avatar.jpg"
      if (uploadIndex === -1) {
        const urlParts = urlWithoutExtension.split('/');
        // Pega as últimas 2 partes (pasta/arquivo)
        return urlParts.slice(-2).join('/');
      }

      // Pega tudo após /upload/vXXXX/ ou /upload/
      const afterUpload = urlWithoutExtension.substring(uploadIndex + 8); // 8 = length of "/upload/"

      // Se tem versão (v123456), pula ela
      const parts = afterUpload.split('/');
      if (parts[0].startsWith('v') && !isNaN(Number(parts[0].substring(1)))) {
        // Remove a versão
        return parts.slice(1).join('/');
      }

      return afterUpload;
    } catch (error) {
      throw new Error(`Failed to extract publicId from URL: ${url}`);
    }
  }
}
