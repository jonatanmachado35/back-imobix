import { UserRepository } from '../../ports/user-repository';
import { IFileStorageService } from '../../ports/file-storage.interface';
import { UserNotFoundError } from './upload-user-avatar.use-case';

export class DeleteUserAvatarUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileStorageService: IFileStorageService,
  ) { }

  async execute(userId: string): Promise<void> {
    // 1. Verificar se usuário existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // 2. Se não tem avatar, nada a fazer
    if (!user.avatar) {
      return;
    }

    // 3. Deletar do Cloudinary (não para a execução se falhar)
    try {
      const publicId = this.extractPublicIdFromUrl(user.avatar);
      await this.fileStorageService.delete(publicId);
    } catch (error) {
      console.error('Failed to delete avatar from Cloudinary:', error);
      // Continua para limpar o banco de dados mesmo se falhar no Cloudinary
    }

    // 4. Limpar campo no banco
    await this.userRepository.update(userId, { avatar: null });
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
