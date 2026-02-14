import { User } from '../../domain/entities/user';
import {
  UserRepository,
  CreateUserData,
  UpdateUserData
} from '../../application/ports/user-repository';

/**
 * In-memory implementation of UserRepository for testing purposes
 */
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];
  private idCounter = 1;

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.users.find(u => u.resetPasswordToken === token) || null;
  }

  async create(data: CreateUserData): Promise<User> {
    const now = new Date();
    const user = new User(
      `user-${this.idCounter++}`,
      data.nome,
      data.email,
      data.passwordHash,
      data.role || 'USER',
      now,
      now,
      null,
      null,
      data.userRole || 'cliente',
      null,
      null,
      null,
    );
    this.users.push(user);
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const existingUser = this.users[userIndex];
    const updatedUser = existingUser.updateProfile(data);
    this.users[userIndex] = updatedUser;
    return updatedUser;
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const existingUser = this.users[userIndex];
    const updatedUser = new User(
      existingUser.id,
      existingUser.nome,
      existingUser.email,
      existingUser.passwordHash,
      existingUser.role,
      existingUser.createdAt,
      new Date(),
      existingUser.phone,
      existingUser.avatar,
      existingUser.userRole,
      token,
      existingUser.resetPasswordToken,
      existingUser.resetPasswordExpiry,
    );
    this.users[userIndex] = updatedUser;
  }

  async save(user: User): Promise<void> {
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
      this.users.push(user);
    } else {
      this.users[userIndex] = user;
    }
  }

  // Helper methods for testing
  clear(): void {
    this.users = [];
    this.idCounter = 1;
  }

  getAll(): User[] {
    return [...this.users];
  }
}
