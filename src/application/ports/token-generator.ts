export interface TokenGenerator {
  generate(payload: { userId: string; email: string; role: string }): string;
}
