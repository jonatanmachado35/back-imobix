import { User } from '../../domain/entities/user';

export type CreateUserData = {
  nome: string;
  email: string;
  passwordHash: string;
};

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}
