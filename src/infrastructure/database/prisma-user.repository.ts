import { Injectable } from '@nestjs/common';
import { CreateUserData, UserRepository } from '../../application/ports/user-repository';
import { User } from '../../domain/entities/user';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user
      ? new User(
        user.id,
        user.nome,
        user.email,
        user.passwordHash,
        user.role,
        user.createdAt,
        user.updatedAt
      )
      : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return new User(
      user.id,
      user.nome,
      user.email,
      user.passwordHash,
      user.role,
      user.createdAt,
      user.updatedAt
    );
  }
}
