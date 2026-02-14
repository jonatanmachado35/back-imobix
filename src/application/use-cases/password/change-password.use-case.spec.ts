import { ChangePasswordUseCase } from './change-password.use-case';
import { InMemoryUserRepository } from '../../../infrastructure/database/in-memory-user.repository';
import { User } from '../../../domain/entities/user';
import {
  InvalidCurrentPasswordError,
  WeakPasswordError,
  PasswordsMatchError
} from './password-errors';
import { UserNotFoundError } from '../user-errors';

class MockPasswordHasher {
  private passwords = new Map<string, string>();

  async hash(plain: string): Promise<string> {
    const hashed = `hashed_${plain}`;
    this.passwords.set(hashed, plain);
    return hashed;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed_${plain}`;
  }
}

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let userRepository: InMemoryUserRepository;
  let passwordHasher: MockPasswordHasher;
  let testUser: User;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new MockPasswordHasher();
    useCase = new ChangePasswordUseCase(userRepository, passwordHasher);

    // Setup test user
    const passwordHash = await passwordHasher.hash('OldPassword123');
    testUser = new User(
      'user-123',
      'Test User',
      'test@example.com',
      passwordHash,
      'USER',
      new Date(),
      new Date(),
    );

    await userRepository.save(testUser);
  });

  it('should change password successfully', async () => {
    await useCase.execute({
      userId: 'user-123',
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword456',
    });

    const updatedUser = await userRepository.findById('user-123');
    const isNewPasswordValid = await passwordHasher.compare(
      'NewPassword456',
      updatedUser!.passwordHash,
    );

    expect(isNewPasswordValid).toBe(true);
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    await expect(
      useCase.execute({
        userId: 'invalid-id',
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should throw InvalidCurrentPasswordError when current password is wrong', async () => {
    await expect(
      useCase.execute({
        userId: 'user-123',
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword456',
      }),
    ).rejects.toThrow(InvalidCurrentPasswordError);
  });

  it('should throw WeakPasswordError when new password is too short', async () => {
    await expect(
      useCase.execute({
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'short',
      }),
    ).rejects.toThrow(WeakPasswordError);
  });

  it('should throw WeakPasswordError when password has no numbers', async () => {
    await expect(
      useCase.execute({
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'OnlyLetters',
      }),
    ).rejects.toThrow(WeakPasswordError);
  });

  it('should throw PasswordsMatchError when new password is same as current', async () => {
    await expect(
      useCase.execute({
        userId: 'user-123',
        currentPassword: 'OldPassword123',
        newPassword: 'OldPassword123',
      }),
    ).rejects.toThrow(PasswordsMatchError);
  });
});
