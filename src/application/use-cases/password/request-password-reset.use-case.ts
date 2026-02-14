import { UserRepository } from '../../ports/user-repository';
import { UserNotFoundError } from '../user-errors';
import * as crypto from 'crypto';

export interface RequestPasswordResetInput {
  email: string;
}

export interface RequestPasswordResetOutput {
  resetToken: string;
  expiresAt: Date;
}

export class RequestPasswordResetUseCase {
  constructor(private readonly userRepository: UserRepository) { }

  async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
    // 1. Buscar usuário por email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UserNotFoundError();
    }

    // 2. Gerar token seguro (32 bytes = 64 caracteres hex)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 3. Definir expiração (1 hora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // 4. Atualizar usuário com token
    const userWithToken = user.setResetToken(resetToken, expiresAt);
    await this.userRepository.save(userWithToken);

    // 5. Retornar token (na versão com email, seria enviado por email)
    return {
      resetToken,
      expiresAt,
    };
  }
}
