import { TenantBrandingData, TenantBrandingRepository } from '../../ports/tenant-branding-repository';

export interface UpdatePainelBrandingInput {
  /** tenantId extraído do JWT — não aceito como parâmetro do cliente (ADR-001) */
  tenantId: string;
  nomePainel?: string;
  subtitulo?: string;
  corPrimaria?: string;
  corSidebar?: string;
}

export type UpdatePainelBrandingOutput = TenantBrandingData;

export class UpdatePainelBrandingUseCase {
  constructor(private readonly brandingRepository: TenantBrandingRepository) {}

  async execute(input: UpdatePainelBrandingInput): Promise<UpdatePainelBrandingOutput> {
    const { tenantId, ...data } = input;
    return this.brandingRepository.upsert(tenantId, data);
  }
}
