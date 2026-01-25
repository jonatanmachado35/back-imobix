import { Lead } from '../../domain/entities/lead';

export type CreateLeadData = {
  nome: string;
  email: string;
  telefone?: string | null;
  origem?: string | null;
  interesse?: string | null;
  anotacoes?: string | null;
};

export type UpdateLeadData = {
  nome?: string;
  telefone?: string | null;
  origem?: string | null;
  interesse?: string | null;
  anotacoes?: string | null;
};

export interface LeadRepository {
  findById(id: string): Promise<Lead | null>;
  findByEmail(email: string): Promise<Lead | null>;
  findAll(): Promise<Lead[]>;
  create(data: CreateLeadData): Promise<Lead>;
  update(id: string, data: UpdateLeadData): Promise<Lead>;
  save(lead: Lead): Promise<Lead>;
}
