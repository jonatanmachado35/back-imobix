import { ResetPasswordUseCase } from './reset-password.use-case';
import { InMemoryUserRepository } from '../../../infrastructure/database/in-memory-user.repository';
import { User } from '../../../domain/entities/user';
import { InvalidResetTokenError, WeakPasswordError } from './password-errors';

class MockPasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed_${plain}`;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed_${plain}`;
  }
}

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let userRepository: InMemoryUserRepository;
  let passwordHasher: MockPasswordHasher;
  let testUser: User;
  const validToken = 'valid-reset-token-123';

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new MockPasswordHasher();
    useCase = new ResetPasswordUseCase(userRepository, passwordHasher);

    // Setup user with valid reset token
    const futureExpiry = new Date(Date.now() + 3600000); // +1 hora
    testUser = new User(
      'user-123',
      'Test User',
      'test@example.com',
      'hashed_OldPassword123',
      'USER',
      new Date(),
      new Date(),
      null,
      null,
      null,
      null,
      validToken,
      futureExpiry,
    );

    await userRepository.save(testUser);
  });

  it('should reset password successfully', async () => {
    await useCase.execute({
      resetToken: validToken,
      newPassword: 'NewPassword456',
    });

    const updatedUser = await userRepository.findById('user-123');
    expect(updatedUser!.passwordHash).toBe('hashed_NewPassword456');
  });

  it('should clear reset token after successful reset', async () => {
    await useCase.execute({
      resetToken: validToken,
      newPassword: 'NewPassword456',
    });

    const updatedUser = await userRepository.findById('user-123');
    expect(updatedUser!.resetPasswordToken).toBeNull();
    expect(updatedUser!.resetPasswordExpiry).toBeNull();
  });

  it('should throw InvalidResetTokenError when token does not exist', async () => {
    await expect(
      useCase.execute({
        resetToken: 'invalid-token',
        newPassword: 'NewPassword456',
      }),
    ).rejects.toThrow(InvalidResetTokenError);
  });

  it('should throw InvalidResetTokenError when token is expired', async () => {
    const pastExpiry = new Date(Date.now() - 3600000); // -1 hora
    const expiredUser = testUser.setResetToken(validToken, pastExpiry);
    await userRepository.save(expiredUser);

    await expect(
      useCase.execute({
        resetToken: validToken,
        newPassword: 'NewPassword456',
      }),
    ).rejects.toThrow(InvalidResetTokenError);
  });

  it('should throw WeakPasswordError when password is too short', async () => {
    await expect(
      useCase.execute({
        resetToken: validToken,
        newPassword: 'short',
      }),
    ).rejects.toThrow(WeakPasswordError);
  });

  it('should throw WeakPasswordError when password has no numbers', async () => {
    await expect(
      useCase.execute({
        resetToken: validToken,
        newPassword: 'OnlyLetters',
      }),
    ).rejects.toThrow(WeakPasswordError);
  });
});
