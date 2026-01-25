import { Injectable } from '@nestjs/common';
import { Lead, LeadStatus } from '../../domain/entities/lead';
import {
  CreateLeadData,
  LeadRepository,
  UpdateLeadData
} from '../../application/ports/lead-repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaLeadRepository implements LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Lead | null> {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    return lead ? this.toDomain(lead) : null;
  }

  async findByEmail(email: string): Promise<Lead | null> {
    const lead = await this.prisma.lead.findFirst({ where: { email } });
    return lead ? this.toDomain(lead) : null;
  }

  async findAll(): Promise<Lead[]> {
    const leads = await this.prisma.lead.findMany({
      orderBy: { dataContato: 'desc' }
    });
    return leads.map((lead) => this.toDomain(lead));
  }

  async create(data: CreateLeadData): Promise<Lead> {
    const lead = await this.prisma.lead.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        origem: data.origem,
        interesse: data.interesse,
        anotacoes: data.anotacoes,
        status: LeadStatus.NOVO
      }
    });
    return this.toDomain(lead);
  }

  async update(id: string, data: UpdateLeadData): Promise<Lead> {
    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        nome: data.nome,
        telefone: data.telefone,
        origem: data.origem,
        interesse: data.interesse,
        anotacoes: data.anotacoes
      }
    });
    return this.toDomain(lead);
  }

  async save(lead: Lead): Promise<Lead> {
    const updated = await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: lead.status,
        anotacoes: lead.anotacoes
      }
    });
    return this.toDomain(updated);
  }

  private toDomain(raw: any): Lead {
    return new Lead(
      raw.id,
      raw.nome,
      raw.email,
      raw.telefone,
      raw.origem,
      raw.interesse,
      raw.status as LeadStatus,
      raw.dataContato,
      raw.updatedAt,
      raw.anotacoes
    );
  }
}
