import { Injectable } from '@nestjs/common';
import { CreateUserData, UpdateUserData, UserRepository } from '../../application/ports/user-repository';
import { User } from '../../domain/entities/user';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) { }

  private toDomain(user: any): User {
    return new User(
      user.id,
      user.nome,
      user.email,
      user.passwordHash,
      user.role,
      user.createdAt,
      user.updatedAt,
      user.phone,
      user.avatar,
      user.userRole,
      user.refreshToken
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toDomain(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role as any || 'USER',
      }
    });
    return this.toDomain(user);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        nome: data.nome,
        email: data.email,
      }
    });
    return this.toDomain(user);
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: token }
    });
  }
}
