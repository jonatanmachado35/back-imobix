import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdTestEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

  }, 30000);

  afterAll(async () => {
    // Cleanup only users created in this test run
    if (prisma && createdTestEmails.length > 0) {
      await prisma.user.deleteMany({
        where: {
          email: { in: createdTestEmails },
        }
      }).catch(() => { });
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const email = `joao.${Date.now()}@example.com`;
      createdTestEmails.push(email);

      // First create a user
      await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'João Silva',
          email,
          password: 'password123',
          userRole: 'cliente'
        });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'password123'
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.email).toBe(email);
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
      const email = `joao.${Date.now()}@example.com`;
      createdTestEmails.push(email);

      // Create user
      await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'João Silva',
          email,
          password: 'password123',
          userRole: 'cliente'
        });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject request with missing password', async () => {
      const email = `joao.${Date.now()}@example.com`;
      createdTestEmails.push(email);
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email
        })
        .expect(400); // ValidationPipe returns 400 for missing required fields
    });
  });
});
