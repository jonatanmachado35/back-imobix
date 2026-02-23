import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Funcionarios Login Flow (e2e)', () => {
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
    if (prisma && createdTestEmails.length > 0) {
      await prisma.user.deleteMany({
        where: { email: { in: createdTestEmails } }
      }).catch(() => { });
    }
    if (app) {
      await app.close();
    }
  });

  it('should create funcionario and allow login with credentials', async () => {
    const adminEmail = `admin.${Date.now()}@imobix.com`;
    const funcionarioEmail = `func.${Date.now()}@imobix.com`;
    createdTestEmails.push(adminEmail, funcionarioEmail);

    // Create admin user
    await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Admin User',
        email: adminEmail,
        password: 'password123',
        userRole: 'cliente'
      })
      .expect(201);

    // Promote to ADMIN for protected route access
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' }
    });

    const loginAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: 'password123' })
      .expect(201);

    const adminToken = loginAdmin.body.access_token;

    // Create funcionario (protected endpoint)
    const createResponse = await request(app.getHttpServer())
      .post('/funcionarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Funcionario Teste',
        email: funcionarioEmail,
        password: 'password123',
        cpf: '123.456.789-00',
        telefone: '11999999999',
        status: 'ATIVO'
      })
      .expect(201);

    expect(createResponse.body).toHaveProperty('data.id');
    expect(createResponse.body.data.email).toBe(funcionarioEmail);

    // Login with funcionario credentials
    const loginFuncionario = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: funcionarioEmail, password: 'password123' })
      .expect(201);

    expect(loginFuncionario.body.access_token).toBeDefined();
    expect(loginFuncionario.body.user.email).toBe(funcionarioEmail);
  });

  it('should not create partial data when user creation fails', async () => {
    const adminEmail = `admin.${Date.now()}@imobix.com`;
    const duplicateEmail = `dup.${Date.now()}@imobix.com`;
    createdTestEmails.push(adminEmail, duplicateEmail);

    // Create admin user
    await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Admin User',
        email: adminEmail,
        password: 'password123',
        userRole: 'cliente'
      })
      .expect(201);

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' }
    });

    const loginAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: 'password123' })
      .expect(201);

    const adminToken = loginAdmin.body.access_token;

    // Seed a user with duplicate email
    await request(app.getHttpServer())
      .post('/users')
      .send({
        nome: 'Duplicado',
        email: duplicateEmail,
        password: 'password123',
        userRole: 'cliente'
      })
      .expect(201);

    // Attempt to create funcionario with duplicate email
    await request(app.getHttpServer())
      .post('/funcionarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Funcionario Duplicado',
        email: duplicateEmail,
        password: 'password123',
        status: 'ATIVO'
      })
      .expect(409);

    const funcionarioCount = await prisma.funcionario.count({
      where: {
        user: { email: duplicateEmail }
      }
    });

    expect(funcionarioCount).toBe(0);
  });
});
