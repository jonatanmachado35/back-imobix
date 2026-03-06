import { TenantBrandingData, TenantBrandingRepository } from '../../ports/tenant-branding-repository';

export interface GetPainelBrandingInput {
  /** tenantId identificado pelo caller (subdomínio, header, query param, JWT).
   * Se null/undefined, retorna os valores default da plataforma. */
  tenantId?: string | null;
}

export type GetPainelBrandingOutput = TenantBrandingData;

export class GetPainelBrandingUseCase {
  constructor(private readonly brandingRepository: TenantBrandingRepository) {}

  async execute(input: GetPainelBrandingInput): Promise<GetPainelBrandingOutput> {
    if (!input.tenantId) {
      return this.brandingRepository.getDefaults();
    }

    const branding = await this.brandingRepository.findByTenantId(input.tenantId);

    // Fallback para defaults se o tenant não tiver branding configurado (ADR-004)
    if (!branding) {
      return this.brandingRepository.getDefaults();
    }

    return branding;
  }
}
