import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('User Registration Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Cleanup apenas usuários que podem conflitar com este teste
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'admin@test.com' },
          { email: 'joao@cliente.com' },
          { email: 'maria@proprietaria.com' },
          { email: 'maria@proprietario.com' },
          { email: 'regular@test.com' },
          { email: 'admincreated@test.com' },
        ],
      },
    }).catch(() => { });

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        nome: 'Admin User',
        email: 'admin@test.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        userRole: 'cliente'
      }
    });

    // Wait for database to commit
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get admin token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });

    if (!loginResponse.body.access_token) {
      // Se falhou, tentar recriar o admin com email diferente para evitar conflitos
      const fallbackEmail = `admin-${Date.now()}@test.com`;
      await prisma.user.create({
        data: {
          nome: 'Admin User Fallback',
          email: fallbackEmail,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          userRole: 'cliente'
        }
      });

      const retryLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: fallbackEmail, password: 'admin123' });

      if (!retryLogin.body.access_token) {
        throw new Error(`Admin login failed: ${JSON.stringify(loginResponse.body)}`);
      }
      adminToken = retryLogin.body.access_token;
    } else {
      adminToken = loginResponse.body.access_token;
    }
  }, 60000); // Aumentar timeout para 60s quando coverage está ativo

  afterAll(async () => {
    // Limpar apenas usuários criados neste teste (com guard para evitar erro de teardown)
    if (prisma && typeof prisma.user !== 'undefined') {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: 'admin@test.com' },
            { email: 'joao@cliente.com' },
            { email: 'maria@proprietaria.com' },
            { email: 'maria@proprietario.com' },
            { email: 'regular@test.com' },
            { email: 'admincreated@test.com' },
            { email: { startsWith: 'admin-' } }, // Captura fallback admin
            { email: { startsWith: 'duplicate-' } }, // Captura emails com timestamp
          ],
        },
      }).catch(() => { });
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /users (Public self-registration)', () => {
    it('should allow anyone to register as CLIENTE', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'João Cliente',
          email: 'joao@cliente.com',
          password: 'senha1234',
          userRole: 'cliente'
        })
        .expect(201);

      expect(response.body).toMatchObject({
        nome: 'João Cliente',
        email: 'joao@cliente.com',
        userRole: 'cliente'
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should allow anyone to register as PROPRIETARIO', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'Maria Proprietária',
          email: 'maria@proprietaria.com',
          password: 'senha1234',
          userRole: 'proprietario'
        })
        .expect(201);

      expect(response.body).toMatchObject({
        nome: 'Maria Proprietária',
        email: 'maria@proprietaria.com',
        userRole: 'proprietario'
      });
    });

    it('should reject registration with invalid userRole', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'Invalid User',
          email: 'invalid@test.com',
          password: 'senha1234',
          userRole: 'invalid_role'
        })
        .expect(400);
    });

    it('should reject registration without userRole', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'No Role User',
          email: 'norole@test.com',
          password: 'senha1234'
        })
        .expect(400);
    });

    it('should reject duplicate email', async () => {
      // Use unique email with timestamp to avoid conflicts with other tests
      const uniqueEmail = `duplicate-${Date.now()}@test.com`;
      console.log('[TEST] Using email:', uniqueEmail);

      // First create the user
      const firstResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'First User',
          email: uniqueEmail,
          password: 'senha1234',
          userRole: 'cliente'
        })
        .expect(201);

      console.log('[TEST] First user created:', firstResponse.body.email);

      // Wait for database to commit (increased for CI/CD stability)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to create duplicate
      console.log('[TEST] Attempting duplicate with email:', uniqueEmail);
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'Duplicate User',
          email: uniqueEmail, // Same email
          password: 'senha1234',
          userRole: 'cliente'
        });

      // Debug: log the response if it's not 409
      if (response.status !== 409) {
        console.log('DUPLICATE EMAIL TEST - Expected 409, got:', response.status);
        console.log('Response body:', response.body);
      }

      expect(response.status).toBe(409);
    });
  });

  describe('POST /auth/register (Admin only)', () => {
    it('should reject registration without authentication', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Unauthorized User',
          email: 'unauth@test.com',
          password: 'senha1234',
          role: 'cliente'
        })
        .expect(401);
    });

    it('should allow admin to create user with auto-login', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created User',
          email: 'admincreated@test.com',
          password: 'senha1234',
          role: 'cliente'
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should reject non-admin user trying to use /auth/register', async () => {
      // Create regular user first
      await request(app.getHttpServer())
        .post('/users')
        .send({
          nome: 'Regular User',
          email: 'regular@test.com',
          password: 'senha1234',
          userRole: 'cliente'
        })
        .expect(201);

      // Login as regular user
      const userLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'regular@test.com', password: 'senha1234' });

      if (!userLoginResponse.body.access_token) {
        throw new Error(`User login failed: ${JSON.stringify(userLoginResponse.body)}`);
      }
      const userToken = userLoginResponse.body.access_token;

      // Try to create user (should fail)
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Forbidden User',
          email: 'forbidden@test.com',
          password: 'senha1234',
          role: 'cliente'
        })
        .expect(403);
    });
  });
});
