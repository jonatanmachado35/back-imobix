import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Leads (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  }, 30000);

  beforeEach(async () => {
    if (prisma) {
      await prisma.lead.deleteMany().catch(() => { });
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /leads', () => {
    it('should create a new lead', async () => {
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com',
          telefone: '11999999999',
          origem: 'Website',
          interesse: 'Casa na praia'
        })
        .expect(201);

      expect(response.body).toMatchObject({
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '11999999999',
        status: 'NOVO'
      });
      expect(response.body.id).toBeDefined();
    });

    it('should create lead with minimal data', async () => {
      const response = await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'Maria Santos',
          email: 'maria@example.com'
        })
        .expect(201);

      expect(response.body.nome).toBe('Maria Santos');
      expect(response.body.email).toBe('maria@example.com');
      expect(response.body.telefone).toBeNull();
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com'
        });

      await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva 2',
          email: 'joao@example.com'
        })
        .expect(409);
    });

    it('should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva',
          email: 'invalid-email'
        })
        .expect(400);
    });
  });

  describe('GET /leads', () => {
    it('should return all leads', async () => {
      await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com'
        });

      await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'Maria Santos',
          email: 'maria@example.com'
        });

      const response = await request(app.getHttpServer())
        .get('/leads')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should return empty array when no leads exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/leads')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /leads/:id', () => {
    it('should return lead by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com',
          telefone: '11999999999'
        });

      const response = await request(app.getHttpServer())
        .get(`/leads/${created.body.id}`)
        .expect(200);

      expect(response.body.nome).toBe('João Silva');
      expect(response.body.email).toBe('joao@example.com');
    });

    it('should return 404 for non-existent lead', async () => {
      await request(app.getHttpServer())
        .get('/leads/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /leads/:id', () => {
    it('should update lead data', async () => {
      const created = await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com'
        });

      const response = await request(app.getHttpServer())
        .put(`/leads/${created.body.id}`)
        .send({
          telefone: '11999999999',
          origem: 'Facebook'
        })
        .expect(200);

      expect(response.body.telefone).toBe('11999999999');
      expect(response.body.origem).toBe('Facebook');
      expect(response.body.nome).toBe('João Silva'); // Unchanged
    });

    it('should return 404 for non-existent lead', async () => {
      await request(app.getHttpServer())
        .put('/leads/non-existent-id')
        .send({ telefone: '11999999999' })
        .expect(404);
    });
  });

  describe('PATCH /leads/:id/qualify', () => {
    it('should qualify a lead', async () => {
      const created = await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com'
        });

      const response = await request(app.getHttpServer())
        .patch(`/leads/${created.body.id}/qualify`)
        .expect(200);

      expect(response.body.status).toBe('QUALIFICADO');
    });

    it('should return 404 for non-existent lead', async () => {
      await request(app.getHttpServer())
        .patch('/leads/non-existent-id/qualify')
        .expect(404);
    });
  });

  describe('PATCH /leads/:id/convert', () => {
    it('should convert a qualified lead', async () => {
      const created = await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com'
        });

      // Qualify first
      await request(app.getHttpServer())
        .patch(`/leads/${created.body.id}/qualify`);

      // Then convert
      const response = await request(app.getHttpServer())
        .patch(`/leads/${created.body.id}/convert`)
        .expect(200);

      expect(response.body.status).toBe('CONVERTIDO');
    });

    it('should return 400 when trying to convert non-qualified lead', async () => {
      const created = await request(app.getHttpServer())
        .post('/leads')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com'
        });

      await request(app.getHttpServer())
        .patch(`/leads/${created.body.id}/convert`)
        .expect(400); // BadRequestException - lead deve estar qualificado
    });

    it('should return 404 for non-existent lead', async () => {
      await request(app.getHttpServer())
        .patch('/leads/non-existent-id/convert')
        .expect(404);
    });
  });
});
