import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com',
          password: 'password123'
        });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'joao@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.email).toBe('joao@example.com');
      expect(response.body.user.nome).toBe('João Silva');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);
    });

    it('should reject invalid password', async () => {
      // Create user
      await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'João Silva',
          email: 'joao@example.com',
          password: 'password123'
        });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'joao@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject request with missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'joao@example.com'
        })
        .expect(401); // Auth service returns 401, not 400
    });
  });
});
