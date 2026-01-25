import { Lead, LeadStatus, InvalidLeadDataError } from './lead';

describe('Lead Entity', () => {
  describe('creation', () => {
    it('should create a valid lead', () => {
      const now = new Date();
      const lead = new Lead(
        '1',
        'João Silva',
        'joao@example.com',
        '11999999999',
        'Website',
        'Apartamento na praia',
        LeadStatus.NOVO,
        now,
        now
      );

      expect(lead.id).toBe('1');
      expect(lead.nome).toBe('João Silva');
      expect(lead.email).toBe('joao@example.com');
      expect(lead.status).toBe(LeadStatus.NOVO);
    });

    it('should reject empty name', () => {
      const now = new Date();
      expect(() => {
        new Lead('1', '', 'joao@example.com', null, null, null, LeadStatus.NOVO, now, now);
      }).toThrow(InvalidLeadDataError);
    });

    it('should reject invalid email format', () => {
      const now = new Date();
      expect(() => {
        new Lead('1', 'João Silva', 'invalid-email', null, null, null, LeadStatus.NOVO, now, now);
      }).toThrow(InvalidLeadDataError);
    });

    it('should allow null optional fields', () => {
      const now = new Date();
      const lead = new Lead('1', 'João Silva', 'joao@example.com', null, null, null, LeadStatus.NOVO, now, now);

      expect(lead.telefone).toBeNull();
      expect(lead.origem).toBeNull();
      expect(lead.interesse).toBeNull();
    });
  });

  describe('status transitions', () => {
    it('should convert lead to qualified status', () => {
      const now = new Date();
      const lead = new Lead(
        '1',
        'João Silva',
        'joao@example.com',
        null,
        null,
        null,
        LeadStatus.NOVO,
        now,
        now
      );

      const qualified = lead.qualify();

      expect(qualified.status).toBe(LeadStatus.QUALIFICADO);
      expect(qualified.id).toBe(lead.id);
    });

    it('should mark lead as contacted', () => {
      const now = new Date();
      const lead = new Lead(
        '1',
        'João Silva',
        'joao@example.com',
        null,
        null,
        null,
        LeadStatus.NOVO,
        now,
        now
      );

      const contacted = lead.markAsContacted();

      expect(contacted.status).toBe(LeadStatus.CONTATADO);
    });

    it('should convert lead', () => {
      const now = new Date();
      const lead = new Lead(
        '1',
        'João Silva',
        'joao@example.com',
        null,
        null,
        null,
        LeadStatus.QUALIFICADO,
        now,
        now
      );

      const converted = lead.convert();

      expect(converted.status).toBe(LeadStatus.CONVERTIDO);
    });

    it('should mark lead as lost', () => {
      const now = new Date();
      const lead = new Lead(
        '1',
        'João Silva',
        'joao@example.com',
        null,
        null,
        null,
        LeadStatus.CONTATADO,
        now,
        now
      );

      const lost = lead.markAsLost();

      expect(lost.status).toBe(LeadStatus.PERDIDO);
    });
  });

  describe('business rules', () => {
    it('should not allow converting a new lead directly', () => {
      const now = new Date();
      const lead = new Lead(
        '1',
        'João Silva',
        'joao@example.com',
        null,
        null,
        null,
        LeadStatus.NOVO,
        now,
        now
      );

      expect(() => lead.convert()).toThrow('Lead must be qualified before conversion');
    });

    it('should not allow re-converting already converted lead', () => {
      const now = new Date();
      const lead = new Lead(
        '1',
        'João Silva',
        'joao@example.com',
        null,
        null,
        null,
        LeadStatus.CONVERTIDO,
        now,
        now
      );

      expect(() => lead.convert()).toThrow('Lead is already converted');
    });
  });

  describe('with notes', () => {
    it('should create lead with notes', () => {
      const now = new Date();
      const lead = new Lead(
        '1',
        'João Silva',
        'joao@example.com',
        null,
        null,
        null,
        LeadStatus.NOVO,
        now,
        now,
        'Cliente interessado em propriedades na praia'
      );

      expect(lead.anotacoes).toBe('Cliente interessado em propriedades na praia');
    });

    it('should add notes to existing lead', () => {
      const now = new Date();
      const lead = new Lead(
        '1',
        'João Silva',
        'joao@example.com',
        null,
        null,
        null,
        LeadStatus.NOVO,
        now,
        now
      );

      const withNotes = lead.addNotes('Primeira visita agendada');

      expect(withNotes.anotacoes).toBe('Primeira visita agendada');
    });
  });
});
