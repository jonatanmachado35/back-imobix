import { LogoutUseCase } from './logout.use-case';
import { UserRepository } from '../ports/user-repository';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    useCase = new LogoutUseCase(mockUserRepository);
  });

  describe('Happy Path', () => {
    it('should clear refresh token on logout', async () => {
      mockUserRepository.updateRefreshToken.mockResolvedValue(undefined);

      await useCase.execute('user-123');

      expect(mockUserRepository.updateRefreshToken).toHaveBeenCalledWith('user-123', null);
    });
  });
});
