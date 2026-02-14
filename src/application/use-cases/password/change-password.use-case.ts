import { UserRepository } from '../../ports/user-repository';
import { PasswordHasher } from '../../ports/password-hasher';
import { UserNotFoundError } from '../user-errors';
import {
  InvalidCurrentPasswordError,
  WeakPasswordError,
  PasswordsMatchError
} from './password-errors';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) { }

  async execute(input: ChangePasswordInput): Promise<void> {
    // 1. Buscar usuário
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // 2. Verificar senha atual
    const isCurrentPasswordValid = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCurrentPasswordError();
    }

    // 3. Validar nova senha
    this.validatePassword(input.newPassword);

    // 4. Verificar se nova senha é diferente da atual
    const isSamePassword = await this.passwordHasher.compare(
      input.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new PasswordsMatchError();
    }

    // 5. Hash da nova senha
    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);

    // 6. Atualizar usuário (imutável)
    const updatedUser = user.changePassword(newPasswordHash);

    // 7. Persistir
    await this.userRepository.save(updatedUser);
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new WeakPasswordError('Senha deve ter no mínimo 8 caracteres');
    }

    // Regex: pelo menos 1 letra, 1 número
    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d).+$/.test(password);
    if (!hasLetterAndNumber) {
      throw new WeakPasswordError('Senha deve conter letras e números');
    }
  }
}
