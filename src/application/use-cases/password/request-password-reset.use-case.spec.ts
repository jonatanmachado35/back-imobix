import { RequestPasswordResetUseCase } from './request-password-reset.use-case';
import { InMemoryUserRepository } from '../../../infrastructure/database/in-memory-user.repository';
import { User } from '../../../domain/entities/user';
import { UserNotFoundError } from '../user-errors';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let userRepository: InMemoryUserRepository;
  let testUser: User;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    useCase = new RequestPasswordResetUseCase(userRepository);

    testUser = new User(
      'user-123',
      'Test User',
      'test@example.com',
      'hashed-password',
      'USER',
      new Date(),
      new Date(),
    );

    await userRepository.save(testUser);
  });

  it('should generate reset token successfully', async () => {
    const result = await useCase.execute({ email: 'test@example.com' });

    expect(result.resetToken).toBeDefined();
    expect(result.resetToken).toHaveLength(64); // 32 bytes hex
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should save reset token in user', async () => {
    const result = await useCase.execute({ email: 'test@example.com' });

    const updatedUser = await userRepository.findById('user-123');
    expect(updatedUser!.resetPasswordToken).toBe(result.resetToken);
    expect(updatedUser!.resetPasswordExpiry).toEqual(result.expiresAt);
  });

  it('should throw UserNotFoundError when email does not exist', async () => {
    await expect(
      useCase.execute({ email: 'nonexistent@example.com' }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should generate different tokens for multiple requests', async () => {
    const result1 = await useCase.execute({ email: 'test@example.com' });
    const result2 = await useCase.execute({ email: 'test@example.com' });

    expect(result1.resetToken).not.toBe(result2.resetToken);
  });

  it('should set expiry to approximately 1 hour from now', async () => {
    const before = Date.now();
    const result = await useCase.execute({ email: 'test@example.com' });
    const after = Date.now();

    const expectedExpiry = before + 3600000; // +1 hour
    const actualExpiry = result.expiresAt.getTime();

    expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry);
    expect(actualExpiry).toBeLessThanOrEqual(after + 3600000);
  });
});
