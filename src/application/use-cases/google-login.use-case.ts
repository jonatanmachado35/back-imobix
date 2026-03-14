import { TokenGenerator } from '../ports/token-generator';
import { UserRepository } from '../ports/user-repository';
import { resolveUserType } from './login.use-case';

export class InvalidGoogleTokenError extends Error {
  constructor() {
    super('Invalid Google token');
    this.name = 'InvalidGoogleTokenError';
  }
}

export class GoogleUserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'GoogleUserNotFoundError';
  }
}

export interface GoogleTokenInfo {
  email: string;
  name: string;
  picture: string;
  sub: string;
  aud: string;
}

export interface GoogleLoginInput {
  idToken: string;
}

export interface GoogleLoginOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    userType: string;
    avatarUrl: string | null;
  };
}

export class GoogleLoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenGenerator: TokenGenerator,
    private readonly googleClientId: string,
    private readonly googleTokenVerifier: (idToken: string) => Promise<GoogleTokenInfo>,
  ) {}

  async execute(input: GoogleLoginInput): Promise<GoogleLoginOutput> {
    // 1. Verify token with Google — any failure means invalid token
    let tokenInfo: GoogleTokenInfo;
    try {
      tokenInfo = await this.googleTokenVerifier(input.idToken);
    } catch {
      throw new InvalidGoogleTokenError();
    }

    // 2. Validate audience matches our client ID
    if (tokenInfo.aud !== this.googleClientId) {
      throw new InvalidGoogleTokenError();
    }

    // 3. Find user by email
    const user = await this.userRepository.findByEmail(tokenInfo.email);
    if (!user) {
      throw new GoogleUserNotFoundError();
    }

    // 4. Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? null,
    };

    const accessToken = this.tokenGenerator.generate(tokenPayload);
    const refreshToken = this.tokenGenerator.generateRefreshToken(tokenPayload);

    // 5. Persist refresh token
    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    // 6. Build response — avatarUrl: use stored avatar or fall back to Google picture
    const avatarUrl = user.avatar ?? tokenInfo.picture ?? null;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.nome,
        userType: resolveUserType(user.role, user.userRole),
        avatarUrl,
      },
    };
  }
}
