import { Injectable } from '@nestjs/common';
import {
  TenantBrandingData,
  TenantBrandingRepository,
  UpdateTenantBrandingData,
} from '../../application/ports/tenant-branding-repository';
import { PrismaService } from './prisma.service';

const DEFAULTS: TenantBrandingData = {
  nomePainel: 'Imobix',
  subtitulo: 'Gestão de Temporada',
  corPrimaria: '#2563EB',
  corSidebar: '#1E3A5F',
  logoUrl: null,
};

@Injectable()
export class PrismaTenantBrandingRepository implements TenantBrandingRepository {
  constructor(private readonly prisma: PrismaService) {}

  getDefaults(): TenantBrandingData {
    return { ...DEFAULTS };
  }

  async findByTenantId(tenantId: string): Promise<TenantBrandingData | null> {
    const branding = await (this.prisma as any).tenantBranding.findUnique({
      where: { tenantId },
    });

    if (!branding) return null;

    return {
      nomePainel: branding.nomePainel,
      subtitulo: branding.subtitulo,
      corPrimaria: branding.corPrimaria,
      corSidebar: branding.corSidebar,
      logoUrl: branding.logoUrl ?? null,
    };
  }

  async upsert(tenantId: string, data: UpdateTenantBrandingData): Promise<TenantBrandingData> {
    const branding = await (this.prisma as any).tenantBranding.upsert({
      where: { tenantId },
      create: {
        tenantId,
        nomePainel: data.nomePainel ?? DEFAULTS.nomePainel,
        subtitulo: data.subtitulo ?? DEFAULTS.subtitulo,
        corPrimaria: data.corPrimaria ?? DEFAULTS.corPrimaria,
        corSidebar: data.corSidebar ?? DEFAULTS.corSidebar,
        logoUrl: data.logoUrl ?? null,
      },
      update: {
        ...(data.nomePainel !== undefined && { nomePainel: data.nomePainel }),
        ...(data.subtitulo !== undefined && { subtitulo: data.subtitulo }),
        ...(data.corPrimaria !== undefined && { corPrimaria: data.corPrimaria }),
        ...(data.corSidebar !== undefined && { corSidebar: data.corSidebar }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
    });

    return {
      nomePainel: branding.nomePainel,
      subtitulo: branding.subtitulo,
      corPrimaria: branding.corPrimaria,
      corSidebar: branding.corSidebar,
      logoUrl: branding.logoUrl ?? null,
    };
  }
}
