import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('PortfoliosController (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let accessToken: string;
  let assetId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;

    const { AppModule } = require('../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(APP_GUARD)
    .useValue({ canActivate: () => true }) // Disable rate limiting for tests
    .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // Register and login to get token
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'portfolio@test.com', password: 'password123' });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'portfolio@test.com', password: 'password123' });

    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    await app.close();
  });

  it('/api/portfolios/assets (POST) - should add an asset', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/portfolios/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Apple Inc.',
        symbol: 'AAPL',
        type: 'STOCK',
        quantity: 10,
        purchasePrice: 150,
        currentPrice: 175,
      });

    expect(res.status).toBe(201);
    expect(res.body.assets).toBeDefined();
    expect(res.body.assets.length).toBe(1);
    expect(res.body.assets[0].symbol).toBe('AAPL');
    
    assetId = res.body.assets[0]._id;
  });

  it('/api/portfolios (GET) - should return portfolio with summary and pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/portfolios?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.assets.length).toBe(1);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.totalValue).toBe(1750); // 10 * 175
    expect(res.body.summary.totalCost).toBe(1500);  // 10 * 150
    expect(res.body.summary.totalReturnPercentage).toBeGreaterThan(0);
    expect(res.body.hasMore).toBe(false);
  });

  it('/api/portfolios (GET) - should filter by type', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/portfolios?type=BOND')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.assets.length).toBe(0); // AAPL is a STOCK
  });

  it('/api/portfolios (GET) - should filter by search', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/portfolios?search=apple')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.assets.length).toBe(1);
  });

  it('/api/portfolios/assets/:id (PUT) - should update an asset', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/portfolios/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPrice: 200, // Update price
      });

    expect(res.status).toBe(200);
  });

  it('/api/portfolios/assets/:id (DELETE) - should remove an asset', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/portfolios/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.assets.length).toBe(0);
  });
});
