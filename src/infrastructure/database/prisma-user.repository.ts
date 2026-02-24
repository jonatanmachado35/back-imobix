import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateAuditLogData } from '../../application/ports/admin-audit-log-repository';
import { CreateUserData, ListUsersFilters, ListUsersResult, SaveWithAuditLogOptions, UpdateUserData, UserRepository } from '../../application/ports/user-repository';
import { EmailAlreadyExistsError } from '../../application/use-cases/user-errors';
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
      user.refreshToken,
      user.resetPasswordToken,
      user.resetPasswordExpiry,
      user.status || 'ACTIVE',
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

  async findByResetToken(token: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { resetPasswordToken: token }
    });
    return user ? this.toDomain(user) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          nome: data.nome,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role as any || 'USER',
          userRole: data.userRole || 'cliente',
        }
      });
      return this.toDomain(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new EmailAlreadyExistsError(data.email);
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        nome: data.nome,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
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

  async save(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        nome: user.nome,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role as any,
        status: user.status as any,
        avatar: user.avatar,
        phone: user.phone,
        userRole: user.userRole,
        refreshToken: user.refreshToken,
        resetPasswordToken: user.resetPasswordToken,
        resetPasswordExpiry: user.resetPasswordExpiry,
      }
    });
  }

  async saveWithAuditLog(
    user: User,
    auditLogData: CreateAuditLogData,
    options?: SaveWithAuditLogOptions,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Save user state
      await tx.user.update({
        where: { id: user.id },
        data: {
          nome: user.nome,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role as any,
          status: user.status as any,
          avatar: user.avatar,
          phone: user.phone,
          userRole: user.userRole,
          refreshToken: user.refreshToken,
          resetPasswordToken: user.resetPasswordToken,
          resetPasswordExpiry: user.resetPasswordExpiry,
        },
      });

      // 2. Invalidate refresh token if requested (block operation - RN-02)
      if (options?.invalidateRefreshToken) {
        await tx.user.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });
      }

      // 3. Create audit log in the same transaction
      await tx.adminAuditLog.create({
        data: {
          adminId: auditLogData.adminId,
          targetUserId: auditLogData.targetUserId,
          action: auditLogData.action as any,
          details: auditLogData.details,
        },
      });
    });
  }

  async findAll(filters: ListUsersFilters): Promise<ListUsersResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      const statusMap: Record<string, string> = { active: 'ACTIVE', blocked: 'BLOCKED' };
      where.status = statusMap[filters.status] || filters.status;
    }

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => this.toDomain(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
