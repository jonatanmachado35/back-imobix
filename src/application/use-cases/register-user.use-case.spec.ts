import { RegisterUserUseCase, RegisterUserInput, UserRole } from './register-user.use-case';
import { EmailAlreadyExistsError } from './user-errors';
import { UserRepository } from '../ports/user-repository';
import { PasswordHasher } from '../ports/password-hasher';
import { TokenGenerator } from '../ports/token-generator';
import { User } from '../../domain/entities/user';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPasswordHasher: jest.Mocked<PasswordHasher>;
  let mockTokenGenerator: jest.Mocked<TokenGenerator>;

  const mockUser = new User(
    'user-123',
    'João Silva',
    'joao@email.com',
    'hashed-password',
    'USER',
    new Date(),
    new Date()
  );

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    mockPasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    mockTokenGenerator = {
      generate: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    useCase = new RegisterUserUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockTokenGenerator
    );
  });

  describe('Happy Path', () => {
    it('should create user with role cliente and return token', async () => {
      const input: RegisterUserInput = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha12345',
        role: UserRole.CLIENTE,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenGenerator.generate.mockReturnValue('jwt-token');
      mockTokenGenerator.generateRefreshToken.mockReturnValue('refresh-token');

      const result = await useCase.execute(input);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          name: mockUser.nome,
          email: mockUser.email,
          role: UserRole.CLIENTE,
        },
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('joao@email.com');
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('senha12345');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        nome: 'João Silva',
        email: 'joao@email.com',
        passwordHash: 'hashed-password',
        role: 'USER',
        userRole: 'cliente',
      });
    });

    it('should create user with role proprietario', async () => {
      const input: RegisterUserInput = {
        name: 'Maria Proprietária',
        email: 'maria@email.com',
        password: 'senha12345',
        role: UserRole.PROPRIETARIO,
      };

      const proprietarioUser = new User(
        'user-456',
        'Maria Proprietária',
        'maria@email.com',
        'hashed-password',
        'ADMIN',
        new Date(),
        new Date()
      );

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue(proprietarioUser);
      mockTokenGenerator.generate.mockReturnValue('jwt-token');
      mockTokenGenerator.generateRefreshToken.mockReturnValue('refresh-token');

      const result = await useCase.execute(input);

      expect(result.user.role).toBe(UserRole.PROPRIETARIO);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        nome: 'Maria Proprietária',
        email: 'maria@email.com',
        passwordHash: 'hashed-password',
        role: 'ADMIN',
        userRole: 'proprietario',
      });
    });
  });

  describe('Validation Errors', () => {
    it('should throw EmailAlreadyExistsError if email already exists', async () => {
      const input: RegisterUserInput = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha12345',
        role: UserRole.CLIENTE,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(useCase.execute(input)).rejects.toThrow(EmailAlreadyExistsError);
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if password is less than 8 characters', async () => {
      const input: RegisterUserInput = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: '1234567', // 7 chars
        role: UserRole.CLIENTE,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should throw error if name is empty', async () => {
      const input: RegisterUserInput = {
        name: '',
        email: 'joao@email.com',
        password: 'senha12345',
        role: UserRole.CLIENTE,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Name is required');
    });

    it('should throw error if email is invalid', async () => {
      const input: RegisterUserInput = {
        name: 'João Silva',
        email: 'invalid-email',
        password: 'senha12345',
        role: UserRole.CLIENTE,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Invalid email format');
    });
  });

  describe('Edge Cases', () => {
    it('should trim whitespace from name and email', async () => {
      const input: RegisterUserInput = {
        name: '  João Silva  ',
        email: '  joao@email.com  ',
        password: 'senha12345',
        role: UserRole.CLIENTE,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenGenerator.generate.mockReturnValue('jwt-token');
      mockTokenGenerator.generateRefreshToken.mockReturnValue('refresh-token');

      await useCase.execute(input);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('joao@email.com');
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'João Silva',
          email: 'joao@email.com',
        })
      );
    });
  });
});
