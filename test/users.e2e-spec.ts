import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    // Cleanup only specific test emails
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: 'ana@example.com' },
            { email: 'ana-duplicate@example.com' },
          ]
        }
      }).catch(() => { });
    }
  }, 30000);

  afterAll(async () => {
    // Cleanup test data
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: 'ana@example.com' },
            { email: 'ana-duplicate@example.com' },
          ]
        }
      }).catch(() => { });
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /users creates a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Ana',
        email: 'ana@example.com',
        password: 'password123',
        userRole: 'cliente'
      })
      .expect(201);

    expect(response.body).toMatchObject({
      nome: 'Ana',
      email: 'ana@example.com'
    });
    expect(response.body.id).toBeDefined();
  });

  it('POST /users rejects duplicate email', async () => {
    // First create a user
    await request(app.getHttpServer()).post('/users').send({
      nome: 'Ana',
      email: 'ana-duplicate@example.com',
      password: 'password123',
      userRole: 'cliente'
    }).expect(201);

    // Wait for database to commit
    await new Promise(resolve => setTimeout(resolve, 200));

    // Try to create another user with same email
    await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Ana 2',
        email: 'ana-duplicate@example.com',
        password: 'password123',
        userRole: 'cliente'
      })
      .expect(409);
  });
});
