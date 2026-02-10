import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '../../application/ports/password-hasher';

@Injectable()
export class BcryptHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    // Validate input before hashing
    if (!plain || typeof plain !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    const rawRounds = process.env.BCRYPT_SALT_ROUNDS;
    const rounds = rawRounds ? Number(rawRounds) : 10;
    const safeRounds = Number.isFinite(rounds) ? rounds : 10;
    return bcrypt.hash(plain, safeRounds);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    // Safe wrapper: Return false instead of throwing error (BUG-011 fix)
    if (!plain || !hashed || typeof plain !== 'string' || typeof hashed !== 'string') {
      return false;
    }

    try {
      return await bcrypt.compare(plain, hashed);
    } catch (error) {
      console.error('Bcrypt compare error:', error);
      return false;
    }
  }
}
