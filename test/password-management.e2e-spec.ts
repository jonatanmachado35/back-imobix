import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

jest.setTimeout(60000);

describe('Password Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['password-admin@test.com', 'password-user@test.com'],
        },
      },
    });

    await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Admin User',
        email: 'password-admin@test.com',
        password: 'Admin1234',
        userRole: 'cliente',
      })
      .expect(201);

    await prisma.user.update({
      where: { email: 'password-admin@test.com' },
      data: { role: 'ADMIN' },
    });

    const adminUser = await prisma.user.findUnique({
      where: { email: 'password-admin@test.com' },
    });

    if (!adminUser) {
      throw new Error('Admin user was not created for e2e setup');
    }

    adminToken = jwt.sign(
      { sub: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Normal User',
        email: 'password-user@test.com',
        password: 'User12345',
        userRole: 'cliente',
      })
      .expect(201);

    const normalUser = await prisma.user.findUnique({
      where: { email: 'password-user@test.com' },
    });

    if (!normalUser) {
      throw new Error('Normal user was not created for e2e setup');
    }

    userToken = jwt.sign(
      { sub: normalUser.id, email: normalUser.email, role: normalUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ['password-admin@test.com', 'password-user@test.com'],
          },
        },
      }).catch(() => undefined);
    }

    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/change-password', () => {
    it('should change password when authenticated', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'User12345',
          newPassword: 'NewUser5678',
        })
        .expect(204);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'password-user@test.com', password: 'NewUser5678' })
        .expect(201);
    });

    it('should reject when current password is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'AnotherPass123',
        })
        .expect(400);

      expect(response.body.message).toContain('Senha atual incorreta');
    });
  });

  describe('POST /auth/admin/request-password-reset', () => {
    it('should generate reset token when admin requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/admin/request-password-reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'password-user@test.com' })
        .expect(200);

      expect(response.body.resetToken).toBeDefined();
      expect(response.body.resetToken).toHaveLength(64);
      expect(response.body.expiresAt).toBeDefined();
    });

    it('should reject when non-admin requests token', async () => {
      await request(app.getHttpServer())
        .post('/auth/admin/request-password-reset')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'password-user@test.com' })
        .expect(403);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const tokenResponse = await request(app.getHttpServer())
        .post('/auth/admin/request-password-reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'password-user@test.com' })
        .expect(200);

      const resetToken = tokenResponse.body.resetToken;

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'ResetPass9876',
        })
        .expect(204);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'password-user@test.com', password: 'ResetPass9876' })
        .expect(201);
    });

    it('should reject invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          resetToken: 'invalid-token',
          newPassword: 'ValidPass123',
        })
        .expect(400);

      expect(response.body.message).toContain('Token inválido');
    });
  });
});
