import { BadRequestException, Injectable } from '@nestjs/common';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class ValidateImageFileUseCase {
  execute(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo inválido. Use apenas JPEG, PNG ou WEBP.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Arquivo muito grande. Máximo: 10MB');
    }
  }
}
