export interface TenantBrandingData {
  nomePainel: string;
  subtitulo: string;
  corPrimaria: string;
  corSidebar: string;
  logoUrl?: string | null;
}

export interface UpdateTenantBrandingData {
  nomePainel?: string;
  subtitulo?: string;
  corPrimaria?: string;
  corSidebar?: string;
  logoUrl?: string | null;
}

export interface TenantBrandingRepository {
  /**
   * Busca o branding de um tenant. Retorna null se não existir.
   */
  findByTenantId(tenantId: string): Promise<TenantBrandingData | null>;

  /**
   * Cria ou atualiza (upsert) o branding de um tenant.
   */
  upsert(tenantId: string, data: UpdateTenantBrandingData): Promise<TenantBrandingData>;

  /**
   * Retorna os valores padrão de branding da plataforma Imobix.
   */
  getDefaults(): TenantBrandingData;
}
