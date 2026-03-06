export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string | null;
}

export interface TokenGenerator {
  generate(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verifyRefreshToken(token: string): TokenPayload | null;
}
