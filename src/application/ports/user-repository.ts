import { User } from '../../domain/entities/user';
import { CreateAuditLogData } from './admin-audit-log-repository';

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
  avatar?: string | null;
};

export type ListUsersFilters = {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
};

export type ListUsersResult = {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type SaveWithAuditLogOptions = {
  invalidateRefreshToken?: boolean;
};

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  updateRefreshToken(id: string, token: string | null): Promise<void>;

  // Password management
  save(user: User): Promise<void>;
  findByResetToken(token: string): Promise<User | null>;

  // Admin management
  findAll(filters: ListUsersFilters): Promise<ListUsersResult>;

  /**
   * Saves user and creates audit log in a single transaction.
   * Optionally invalidates refresh token (for block operations).
   * Ensures consistency: if audit log creation fails, user save is rolled back.
   */
  saveWithAuditLog(
    user: User,
    auditLogData: CreateAuditLogData,
    options?: SaveWithAuditLogOptions,
  ): Promise<void>;
}
