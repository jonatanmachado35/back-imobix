import { LeadNotQualifiedError, LeadAlreadyConvertedError } from './lead-errors';

export enum LeadStatus {
  NOVO = 'NOVO',
  CONTATADO = 'CONTATADO',
  QUALIFICADO = 'QUALIFICADO',
  CONVERTIDO = 'CONVERTIDO',
  PERDIDO = 'PERDIDO'
}

export class InvalidLeadDataError extends Error {
  constructor(message: string) {
    super(`Invalid lead data: ${message}`);
    this.name = 'InvalidLeadDataError';
  }
}

export class Lead {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly email: string,
    public readonly telefone: string | null,
    public readonly origem: string | null,
    public readonly interesse: string | null,
    public readonly status: LeadStatus,
    public readonly dataContato: Date,
    public readonly updatedAt: Date,
    public readonly anotacoes?: string | null
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.nome || this.nome.trim().length === 0) {
      throw new InvalidLeadDataError('Nome is required');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      throw new InvalidLeadDataError('Valid email is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  qualify(): Lead {
    return new Lead(
      this.id,
      this.nome,
      this.email,
      this.telefone,
      this.origem,
      this.interesse,
      LeadStatus.QUALIFICADO,
      this.dataContato,
      new Date(),
      this.anotacoes
    );
  }

  markAsContacted(): Lead {
    return new Lead(
      this.id,
      this.nome,
      this.email,
      this.telefone,
      this.origem,
      this.interesse,
      LeadStatus.CONTATADO,
      this.dataContato,
      new Date(),
      this.anotacoes
    );
  }

  convert(): Lead {
    if (this.status === LeadStatus.CONVERTIDO) {
      throw new LeadAlreadyConvertedError();
    }

    if (this.status !== LeadStatus.QUALIFICADO) {
      throw new LeadNotQualifiedError();
    }

    return new Lead(
      this.id,
      this.nome,
      this.email,
      this.telefone,
      this.origem,
      this.interesse,
      LeadStatus.CONVERTIDO,
      this.dataContato,
      new Date(),
      this.anotacoes
    );
  }

  markAsLost(): Lead {
    return new Lead(
      this.id,
      this.nome,
      this.email,
      this.telefone,
      this.origem,
      this.interesse,
      LeadStatus.PERDIDO,
      this.dataContato,
      new Date(),
      this.anotacoes
    );
  }

  addNotes(notes: string): Lead {
    return new Lead(
      this.id,
      this.nome,
      this.email,
      this.telefone,
      this.origem,
      this.interesse,
      this.status,
      this.dataContato,
      new Date(),
      notes
    );
  }
}
