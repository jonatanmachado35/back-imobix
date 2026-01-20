import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '../../application/ports/password-hasher';

@Injectable()
export class BcryptHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const rawRounds = process.env.BCRYPT_SALT_ROUNDS;
    const rounds = rawRounds ? Number(rawRounds) : 10;
    const safeRounds = Number.isFinite(rounds) ? rounds : 10;
    return bcrypt.hash(plain, safeRounds);
  }
}
