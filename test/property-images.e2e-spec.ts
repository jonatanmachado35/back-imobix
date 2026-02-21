import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { IFileStorageService } from '../src/application/ports/file-storage.interface';

describe('Property Images E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let anotherOwnerToken: string;
  let ownerId: string;
  let anotherOwnerId: string;
  let propertyId: string;
  const fileStorageMock = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IFileStorageService)
      .useValue(fileStorageMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    let uploadCounter = 0;
    fileStorageMock.upload.mockImplementation(async () => {
      uploadCounter += 1;
      return {
        publicId: `properties/e2e-upload-${uploadCounter}`,
        url: `http://cdn/e2e-upload-${uploadCounter}.jpg`,
        secureUrl: `https://cdn/e2e-upload-${uploadCounter}.jpg`,
        format: 'jpg',
        width: 1200,
        height: 900,
        bytes: 1024,
      };
    });
    fileStorageMock.delete.mockResolvedValue(undefined);

    const email = `owner-property-images-${Date.now()}@test.com`;
    const password = 'Test@123';

    const owner = await prisma.user.create({
      data: {
        nome: 'Owner Property Images',
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'USER',
        userRole: 'proprietario',
      },
    });

    ownerId = owner.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    ownerToken = loginResponse.body.access_token;

    const anotherEmail = `owner-property-images-alt-${Date.now()}@test.com`;
    const anotherOwner = await prisma.user.create({
      data: {
        nome: 'Another Owner Property Images',
        email: anotherEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'USER',
        userRole: 'proprietario',
      },
    });

    anotherOwnerId = anotherOwner.id;

    const anotherLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: anotherEmail, password });

    anotherOwnerToken = anotherLoginResponse.body.access_token;

    const property = await prisma.property.create({
      data: {
        ownerId,
        type: 'TEMPORADA',
        title: 'Casa teste imagens',
        pricePerNight: 500,
        amenities: [],
        houseRules: [],
        blockedDates: [],
      },
    });

    propertyId = property.id;
  }, 60000);

  afterAll(async () => {
    if (propertyId) {
      await prisma.propertyImage.deleteMany({ where: { propertyId } }).catch(() => undefined);
      await prisma.property.deleteMany({ where: { id: propertyId } }).catch(() => undefined);
    }

    if (ownerId) {
      await prisma.user.deleteMany({ where: { id: ownerId } }).catch(() => undefined);
    }

    if (anotherOwnerId) {
      await prisma.user.deleteMany({ where: { id: anotherOwnerId } }).catch(() => undefined);
    }

    await app.close();
  });

  it('GET /proprietario/properties/:id/images should list images for owner property', async () => {
    const response = await request(app.getHttpServer())
      .get(`/proprietario/properties/${propertyId}/images`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /proprietario/properties/:id/images should return 403 for non-owner', async () => {
    const response = await request(app.getHttpServer())
      .get(`/proprietario/properties/${propertyId}/images`)
      .set('Authorization', `Bearer ${anotherOwnerToken}`);

    expect(response.status).toBe(403);
  });

  it('POST /proprietario/properties/:id/images should return 400 without file', async () => {
    const response = await request(app.getHttpServer())
      .post(`/proprietario/properties/${propertyId}/images`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('isPrimary', 'false')
      .field('displayOrder', '0');

    expect(response.status).toBe(400);
  });

  it('POST /proprietario/properties/:id/images should upload image successfully', async () => {
    const response = await request(app.getHttpServer())
      .post(`/proprietario/properties/${propertyId}/images`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', 'test/fixtures/property.jpg');

    expect(response.status).toBe(201);
    expect(response.body.propertyId).toBe(propertyId);
    expect(response.body.isPrimary).toBe(false);
    expect(fileStorageMock.upload).toHaveBeenCalled();
  });

  it('POST /proprietario/properties/:id/images should reject non-image file', async () => {
    const response = await request(app.getHttpServer())
      .post(`/proprietario/properties/${propertyId}/images`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', Buffer.from('not-an-image'), 'property.txt');

    expect(response.status).toBe(400);
  });

  it('POST /proprietario/properties/:id/images should return 403 for non-owner', async () => {
    const response = await request(app.getHttpServer())
      .post(`/proprietario/properties/${propertyId}/images`)
      .set('Authorization', `Bearer ${anotherOwnerToken}`)
      .attach('file', 'test/fixtures/property.jpg');

    expect(response.status).toBe(403);
  });

  it('POST /proprietario/properties/:id/images should return 400 when property reached max images', async () => {
    const existing = await prisma.propertyImage.count({ where: { propertyId } });
    const missing = 20 - existing;

    for (let index = 0; index < missing; index += 1) {
      await prisma.propertyImage.create({
        data: {
          propertyId,
          publicId: `properties/e2e-max-${Date.now()}-${index}`,
          url: `http://cdn/e2e-max-${index}.jpg`,
          secureUrl: `https://cdn/e2e-max-${index}.jpg`,
          format: 'jpg',
          bytes: 100,
          displayOrder: 10 + index,
          isPrimary: false,
        },
      });
    }

    const response = await request(app.getHttpServer())
      .post(`/proprietario/properties/${propertyId}/images`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', 'test/fixtures/property.jpg');

    expect(response.status).toBe(400);
  });

  it('PATCH /proprietario/properties/:id/images/:imageId/primary should set primary image', async () => {
    const imageA = await prisma.propertyImage.create({
      data: {
        propertyId,
        publicId: `properties/e2e-a-${Date.now()}`,
        url: 'http://cdn/e2e-a.jpg',
        secureUrl: 'https://cdn/e2e-a.jpg',
        format: 'jpg',
        bytes: 100,
        displayOrder: 0,
        isPrimary: false,
      },
    });

    await prisma.propertyImage.create({
      data: {
        propertyId,
        publicId: `properties/e2e-b-${Date.now()}`,
        url: 'http://cdn/e2e-b.jpg',
        secureUrl: 'https://cdn/e2e-b.jpg',
        format: 'jpg',
        bytes: 120,
        displayOrder: 1,
        isPrimary: true,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/proprietario/properties/${propertyId}/images/${imageA.id}/primary`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(imageA.id);
    expect(response.body.isPrimary).toBe(true);
  });

  it('PATCH /proprietario/properties/:id/images/:imageId/primary should return 403 for non-owner', async () => {
    const image = await prisma.propertyImage.create({
      data: {
        propertyId,
        publicId: `properties/e2e-non-owner-primary-${Date.now()}`,
        url: 'http://cdn/e2e-non-owner-primary.jpg',
        secureUrl: 'https://cdn/e2e-non-owner-primary.jpg',
        format: 'jpg',
        bytes: 99,
        displayOrder: 1,
        isPrimary: false,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/proprietario/properties/${propertyId}/images/${image.id}/primary`)
      .set('Authorization', `Bearer ${anotherOwnerToken}`);

    expect(response.status).toBe(403);
  });

  it('DELETE /proprietario/properties/:id/images/:imageId should delete image', async () => {
    const image = await prisma.propertyImage.create({
      data: {
        propertyId,
        publicId: `properties/e2e-delete-${Date.now()}`,
        url: 'http://cdn/e2e-delete.jpg',
        secureUrl: 'https://cdn/e2e-delete.jpg',
        format: 'jpg',
        bytes: 90,
        displayOrder: 2,
        isPrimary: false,
      },
    });

    const response = await request(app.getHttpServer())
      .delete(`/proprietario/properties/${propertyId}/images/${image.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');

    const deleted = await prisma.propertyImage.findUnique({
      where: { id: image.id },
    });
    expect(deleted).toBeNull();
  });

  it('DELETE /proprietario/properties/:id/images/:imageId should return 403 for non-owner', async () => {
    const image = await prisma.propertyImage.create({
      data: {
        propertyId,
        publicId: `properties/e2e-non-owner-delete-${Date.now()}`,
        url: 'http://cdn/e2e-non-owner-delete.jpg',
        secureUrl: 'https://cdn/e2e-non-owner-delete.jpg',
        format: 'jpg',
        bytes: 95,
        displayOrder: 1,
        isPrimary: false,
      },
    });

    const response = await request(app.getHttpServer())
      .delete(`/proprietario/properties/${propertyId}/images/${image.id}`)
      .set('Authorization', `Bearer ${anotherOwnerToken}`);

    expect(response.status).toBe(403);
  });
});
