import { Injectable } from '@nestjs/common';
import {
  CreateTenantData,
  ListTenantsFilters,
  ListTenantsResult,
  TenantDetailData,
  TenantRepository,
  UpdateTenantData,
} from '../../application/ports/tenant-repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDetail(tenant: any, adminUser?: any): TenantDetailData {
    return {
      id: tenant.id,
      nome: tenant.nome,
      status: tenant.status,
      plano: tenant.plano,
      criadoEm: tenant.criadoEm,
      updatedAt: tenant.updatedAt,
      adminEmail: adminUser?.email ?? tenant._adminEmail ?? '',
      totalUsuarios: tenant._count?.users ?? 0,
      totalImoveis: tenant._count?.properties ?? 0,
    };
  }

  async findAll(filters: ListTenantsFilters): Promise<ListTenantsResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.nome = { contains: filters.search, mode: 'insensitive' };
    }

    const prismaAny = this.prisma as any;

    const [tenants, total] = await Promise.all([
      prismaAny.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        include: {
          _count: { select: { users: true } },
          users: {
            where: { role: 'ADMIN' },
            select: { email: true },
            take: 1,
          },
        },
      }),
      prismaAny.tenant.count({ where }),
    ]);

    const data: TenantDetailData[] = tenants.map((t: any) => ({
      id: t.id,
      nome: t.nome,
      status: t.status,
      plano: t.plano,
      criadoEm: t.criadoEm,
      updatedAt: t.updatedAt,
      adminEmail: t.users?.[0]?.email ?? '',
      totalUsuarios: t._count?.users ?? 0,
      totalImoveis: 0, // propriedades ainda não têm tenantId, expandir na Fase 3
    }));

    return {
      data,
      meta: { total, page, limit },
    };
  }

  async findById(id: string): Promise<TenantDetailData | null> {
    const prismaAny = this.prisma as any;
    const tenant = await prismaAny.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
        users: {
          where: { role: 'ADMIN' },
          select: { email: true },
          take: 1,
        },
      },
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      nome: tenant.nome,
      status: tenant.status,
      plano: tenant.plano,
      criadoEm: tenant.criadoEm,
      updatedAt: tenant.updatedAt,
      adminEmail: tenant.users?.[0]?.email ?? '',
      totalUsuarios: tenant._count?.users ?? 0,
      totalImoveis: 0,
    };
  }

  async create(data: CreateTenantData): Promise<TenantDetailData> {
    const prismaAny = this.prisma as any;

    // Cria tenant + usuário admin em transação
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await (tx as any).tenant.create({
        data: {
          nome: data.nome,
          plano: data.plano,
        },
      });

      const adminUser = await (tx as any).user.create({
        data: {
          nome: data.adminNome,
          email: data.adminEmail,
          passwordHash: data.adminPasswordHash,
          role: 'ADMIN',
          userRole: 'proprietario',
          primeiroAcesso: true, // ADR-006: admin recém-criado via Super Admin
          tenantId: tenant.id,
        },
      });

      return { tenant, adminUser };
    });

    return {
      id: result.tenant.id,
      nome: result.tenant.nome,
      status: result.tenant.status,
      plano: result.tenant.plano,
      criadoEm: result.tenant.criadoEm,
      updatedAt: result.tenant.updatedAt,
      adminEmail: result.adminUser.email,
      totalUsuarios: 1,
      totalImoveis: 0,
    };
  }

  async update(id: string, data: UpdateTenantData): Promise<TenantDetailData> {
    const prismaAny = this.prisma as any;

    await prismaAny.tenant.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.plano !== undefined && { plano: data.plano }),
      },
    });

    return this.findById(id) as Promise<TenantDetailData>;
  }

  async suspend(id: string): Promise<void> {
    const prismaAny = this.prisma as any;

    // Suspende tenant + invalida refresh tokens de todos os usuários (ADR-001)
    await this.prisma.$transaction(async (tx: any) => {
      await (tx as any).tenant.update({
        where: { id },
        data: { status: 'SUSPENSO' },
      });

      // Bloqueia imediatamente o login invalidando refresh tokens
      await (tx as any).user.updateMany({
        where: { tenantId: id },
        data: { refreshToken: null },
      });
    });
  }

  async reactivate(id: string): Promise<void> {
    await (this.prisma as any).tenant.update({
      where: { id },
      data: { status: 'ATIVO' },
    });
  }

  async softDelete(id: string): Promise<void> {
    await (this.prisma as any).tenant.update({
      where: { id },
      data: { status: 'REMOVIDO' },
    });
  }
}
