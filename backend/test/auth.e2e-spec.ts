import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let originalMongoUri: string | undefined;

  beforeAll(async () => {
    originalMongoUri = process.env.MONGO_URI;
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();

    const { AppModule } = require('../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api'); // Match main.ts configuration
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await mongoServer.stop();
    process.env.MONGO_URI = originalMongoUri;
  });

  const testUser = {
    email: 'e2e@example.com',
    password: 'password123',
  };

  let accessToken: string;

  it('/api/auth/register (POST) - success', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.user.email).toEqual(testUser.email);
        accessToken = res.body.accessToken;
      });
  });

  it('/api/auth/register (POST) - conflict', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(409); // ConflictException
  });

  it('/api/auth/login (POST) - success', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send(testUser)
      .expect(200)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
      });
  });

  it('/api/auth/me (GET) - success', () => {
    return request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toEqual(testUser.email);
      });
  });

  it('/api/auth/me (GET) - unauthorized', () => {
    return request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401); // UnauthorizedException
  });
});
