import { UserRepository } from '../../ports/user-repository';
import { PasswordHasher } from '../../ports/password-hasher';
import { InvalidResetTokenError, WeakPasswordError } from './password-errors';

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) { }

  async execute(input: ResetPasswordInput): Promise<void> {
    // 1. Buscar usuário por token
    const user = await this.userRepository.findByResetToken(input.resetToken);
    if (!user) {
      throw new InvalidResetTokenError();
    }

    // 2. Validar token (expiry)
    if (!user.isResetTokenValid(input.resetToken)) {
      throw new InvalidResetTokenError();
    }

    // 3. Validar nova senha
    this.validatePassword(input.newPassword);

    // 4. Hash da nova senha
    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);

    // 5. Atualizar senha e limpar token
    const userWithNewPassword = user.changePassword(newPasswordHash);
    const userWithoutToken = userWithNewPassword.clearResetToken();

    // 6. Persistir
    await this.userRepository.save(userWithoutToken);
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new WeakPasswordError('Senha deve ter no mínimo 8 caracteres');
    }

    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d).+$/.test(password);
    if (!hasLetterAndNumber) {
      throw new WeakPasswordError('Senha deve conter letras e números');
    }
  }
}
