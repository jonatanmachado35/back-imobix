import { User } from '../../domain/entities/user';

export type CreateUserData = {
  nome: string;
  email: string;
  passwordHash: string;
  role?: string;
  userRole?: string;
};

export type UpdateUserData = {
  nome?: string;
  email?: string;
  phone?: string;
  avatar?: string;
};

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  updateRefreshToken(id: string, token: string | null): Promise<void>;
}
