export type TenantStatus = 'ATIVO' | 'SUSPENSO' | 'REMOVIDO';
export type Plano = 'BASICO' | 'PRO' | 'ENTERPRISE';

export interface TenantData {
  id: string;
  nome: string;
  status: TenantStatus;
  plano: Plano;
  criadoEm: Date;
  updatedAt: Date;
}

export interface TenantDetailData extends TenantData {
  adminEmail: string;
  totalUsuarios: number;
  totalImoveis: number;
}

export interface CreateTenantData {
  nome: string;
  plano: Plano;
  adminNome: string;
  adminEmail: string;
  adminPasswordHash: string;
}

export interface UpdateTenantData {
  nome?: string;
  plano?: Plano;
}

export interface ListTenantsFilters {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  search?: string;
}

export interface ListTenantsResult {
  data: TenantDetailData[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface TenantRepository {
  findAll(filters: ListTenantsFilters): Promise<ListTenantsResult>;
  findById(id: string): Promise<TenantDetailData | null>;
  create(data: CreateTenantData): Promise<TenantDetailData>;
  update(id: string, data: UpdateTenantData): Promise<TenantDetailData>;
  suspend(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
