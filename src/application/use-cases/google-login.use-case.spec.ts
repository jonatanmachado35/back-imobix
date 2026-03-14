import {
  GoogleLoginUseCase,
  GoogleLoginInput,
  GoogleLoginOutput,
  InvalidGoogleTokenError,
  GoogleUserNotFoundError,
  GoogleTokenInfo,
} from './google-login.use-case';
import { UserRepository } from '../ports/user-repository';
import { TokenGenerator, TokenPayload } from '../ports/token-generator';
import { User } from '../../domain/entities/user';

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_CLIENT_ID = 'my-google-client-id.apps.googleusercontent.com';

function makeUser(): User {
  return new User(
    'user-1',
    'Maria Silva',
    'maria@gmail.com',
    'hashed-password',
    'USER',
    new Date(),
    new Date(),
    null,                 // phone
    null,                 // avatar
    'cliente',            // userRole
    null,                 // refreshToken
    null,                 // resetPasswordToken
    null,                 // resetPasswordExpiry
    'ACTIVE',
    false,
    null,                 // tenantId
    null,                 // tenantStatus
    'light',
  );
}

function makeTokenInfo(overrides: Partial<GoogleTokenInfo> = {}): GoogleTokenInfo {
  return {
    email: 'maria@gmail.com',
    name: 'Maria Silva',
    picture: 'https://lh3.googleusercontent.com/photo.jpg',
    sub: 'google-sub-123',
    aud: VALID_CLIENT_ID,
    ...overrides,
  };
}

// ─── In-memory stubs ─────────────────────────────────────────────────────────

class StubUserRepository implements UserRepository {
  private users: User[] = [];
  private storedRefreshToken: string | null = null;

  addUser(user: User): void {
    this.users.push(user);
  }

  getStoredRefreshToken(): string | null {
    return this.storedRefreshToken;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    this.storedRefreshToken = token;
  }

  // Unused stubs required by interface
  async create(data: any): Promise<User> { throw new Error('not implemented'); }
  async update(id: string, data: any): Promise<User> { throw new Error('not implemented'); }
  async save(user: User): Promise<void> { }
  async findByResetToken(token: string): Promise<User | null> { return null; }
  async findAll(filters: any): Promise<any> { return { data: [], meta: {} }; }
  async saveWithAuditLog(user: User, auditLogData: any, options?: any): Promise<void> { }
}

class StubTokenGenerator implements TokenGenerator {
  generate(payload: TokenPayload): string {
    return `access_token_for_${payload.userId}`;
  }
  generateRefreshToken(payload: TokenPayload): string {
    return `refresh_token_for_${payload.userId}`;
  }
  verifyRefreshToken(token: string): TokenPayload | null {
    return null;
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

function makeUseCase(
  repo: StubUserRepository,
  tokenGenerator: StubTokenGenerator,
  verifier: (idToken: string) => Promise<GoogleTokenInfo>,
  clientId = VALID_CLIENT_ID,
) {
  return new GoogleLoginUseCase(repo, tokenGenerator, clientId, verifier);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GoogleLoginUseCase', () => {
  let repo: StubUserRepository;
  let tokenGenerator: StubTokenGenerator;
  let successVerifier: (idToken: string) => Promise<GoogleTokenInfo>;

  beforeEach(() => {
    repo = new StubUserRepository();
    tokenGenerator = new StubTokenGenerator();
    successVerifier = jest.fn().mockResolvedValue(makeTokenInfo());
    repo.addUser(makeUser());
  });

  describe('Happy Path', () => {
    it('should return accessToken, refreshToken and user on valid login', async () => {
      const useCase = makeUseCase(repo, tokenGenerator, successVerifier);

      const result = await useCase.execute({ idToken: 'valid-token' });

      expect(result.accessToken).toBe('access_token_for_user-1');
      expect(result.refreshToken).toBe('refresh_token_for_user-1');
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('maria@gmail.com');
      expect(result.user.name).toBe('Maria Silva');
      expect(result.user.userType).toBe('cliente');
    });

    it('should use stored avatar when user has one', async () => {
      const userWithAvatar = new User(
        'user-2', 'João', 'joao@gmail.com', 'hash', 'USER',
        new Date(), new Date(), null, 'https://cdn.example.com/my-avatar.jpg',
        'proprietario', null, null, null, 'ACTIVE', false, null, null, 'light',
      );
      repo.addUser(userWithAvatar);
      const verifier = jest.fn().mockResolvedValue(makeTokenInfo({ email: 'joao@gmail.com' }));
      const useCase = makeUseCase(repo, tokenGenerator, verifier);

      const result = await useCase.execute({ idToken: 'valid-token' });

      expect(result.user.avatarUrl).toBe('https://cdn.example.com/my-avatar.jpg');
    });

    it('should fall back to Google picture when user has no stored avatar', async () => {
      const useCase = makeUseCase(repo, tokenGenerator, successVerifier);

      const result = await useCase.execute({ idToken: 'valid-token' });

      expect(result.user.avatarUrl).toBe('https://lh3.googleusercontent.com/photo.jpg');
    });

    it('should return null avatarUrl when user has no avatar and Google has no picture', async () => {
      const verifier = jest.fn().mockResolvedValue(
        makeTokenInfo({ picture: undefined as any }),
      );
      const useCase = makeUseCase(repo, tokenGenerator, verifier);

      const result = await useCase.execute({ idToken: 'valid-token' });

      expect(result.user.avatarUrl).toBeNull();
    });

    it('should persist refreshToken in the repository', async () => {
      const useCase = makeUseCase(repo, tokenGenerator, successVerifier);

      await useCase.execute({ idToken: 'valid-token' });

      expect(repo.getStoredRefreshToken()).toBe('refresh_token_for_user-1');
    });

    it('should resolve userType as "proprietario" for proprietario users', async () => {
      const proprietario = new User(
        'prop-1', 'Carlos', 'carlos@gmail.com', 'hash', 'USER',
        new Date(), new Date(), null, null, 'proprietario',
        null, null, null, 'ACTIVE', false, null, null, 'light',
      );
      repo.addUser(proprietario);
      const verifier = jest.fn().mockResolvedValue(makeTokenInfo({ email: 'carlos@gmail.com' }));
      const useCase = makeUseCase(repo, tokenGenerator, verifier);

      const result = await useCase.execute({ idToken: 'valid-token' });

      expect(result.user.userType).toBe('proprietario');
    });

    it('should call Google verifier with the provided idToken', async () => {
      const useCase = makeUseCase(repo, tokenGenerator, successVerifier);

      await useCase.execute({ idToken: 'my-id-token-123' });

      expect(successVerifier).toHaveBeenCalledWith('my-id-token-123');
    });
  });

  describe('Token Validation', () => {
    it('should throw InvalidGoogleTokenError when verifier throws', async () => {
      const failingVerifier = jest.fn().mockRejectedValue(new Error('network error'));
      const useCase = makeUseCase(repo, tokenGenerator, failingVerifier);

      await expect(useCase.execute({ idToken: 'bad-token' })).rejects.toThrow(
        InvalidGoogleTokenError,
      );
    });

    it('should throw InvalidGoogleTokenError when aud does not match clientId', async () => {
      const wrongAudVerifier = jest.fn().mockResolvedValue(
        makeTokenInfo({ aud: 'wrong-client-id.apps.googleusercontent.com' }),
      );
      const useCase = makeUseCase(repo, tokenGenerator, wrongAudVerifier);

      await expect(useCase.execute({ idToken: 'valid-token' })).rejects.toThrow(
        InvalidGoogleTokenError,
      );
    });
  });

  describe('User Lookup', () => {
    it('should throw GoogleUserNotFoundError when email is not registered', async () => {
      const verifier = jest.fn().mockResolvedValue(
        makeTokenInfo({ email: 'notregistered@gmail.com' }),
      );
      const useCase = makeUseCase(repo, tokenGenerator, verifier);

      await expect(useCase.execute({ idToken: 'valid-token' })).rejects.toThrow(
        GoogleUserNotFoundError,
      );
    });

    it('should NOT call updateRefreshToken when user is not found', async () => {
      const verifier = jest.fn().mockResolvedValue(
        makeTokenInfo({ email: 'ghost@gmail.com' }),
      );
      const useCase = makeUseCase(repo, tokenGenerator, verifier);

      await expect(useCase.execute({ idToken: 'valid-token' })).rejects.toThrow(
        GoogleUserNotFoundError,
      );

      expect(repo.getStoredRefreshToken()).toBeNull();
    });
  });
});
