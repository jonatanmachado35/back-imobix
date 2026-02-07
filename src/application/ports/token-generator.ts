export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenGenerator {
  generate(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verifyRefreshToken(token: string): TokenPayload | null;
}
