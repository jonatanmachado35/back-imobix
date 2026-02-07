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
  }, 30000);

  beforeEach(async () => {
    if (prisma) {
      await prisma.funcionario.deleteMany().catch(() => { });
      await prisma.corretor.deleteMany().catch(() => { });
      await prisma.user.deleteMany().catch(() => { });
    }
  });

  afterAll(async () => {
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
        password: 'password123'
      })
      .expect(201);

    expect(response.body).toMatchObject({
      nome: 'Ana',
      email: 'ana@example.com'
    });
    expect(response.body.id).toBeDefined();
  });

  it('POST /users rejects duplicate email', async () => {
    await request(app.getHttpServer()).post('/users').send({
      nome: 'Ana',
      email: 'ana@example.com',
      password: 'password123'
    });

    await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Ana 2',
        email: 'ana@example.com',
        password: 'password123'
      })
      .expect(409);
  });
});
