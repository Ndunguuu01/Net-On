// apps/api/src/e2e/billing.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('Billing End‑to‑End (API)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let config: ConfigService;
  const apiPrefix = process.env.API_PREFIX || 'api/v1';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    config = moduleFixture.get<ConfigService>(ConfigService);
    // Clean DB state for isolation
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Customer" RESTART IDENTITY CASCADE;');
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const authHeader = () => `Bearer ${process.env.TEST_JWT_ACCESS_TOKEN}`;

  it('1️⃣ Account & Billing Setup – creates customer, plan, and initial invoice', async () => {
    // Create customer
    const custRes = await request(app.getHttpServer())
      .post(`/${apiPrefix}/customers`)
      .set('Authorization', authHeader())
      .send({ name: 'E2E Test Corp', email: 'e2e@test.com' })
      .expect(201);
    const customerId = custRes.body.data.id;

    // Assign plan (assume planId 1 exists)
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/customers/${customerId}/subscribe`)
      .set('Authorization', authHeader())
      .send({ planId: 1 })
      .expect(201);

    // Verify invoice generated
    const invRes = await request(app.getHttpServer())
      .get(`/${apiPrefix}/customers/${customerId}/invoices`)
      .set('Authorization', authHeader())
      .expect(200);
    const invoice = invRes.body.data[0];
    // Ensure amount matches plan price (no rounding drift)
    expect(invoice.amount).toBeCloseTo(invoice.planPrice, 2);
    // TransformInterceptor envelope validation
    expect(invRes.body).toHaveProperty('success', true);
    expect(invRes.body).toHaveProperty('timestamp');
  });

  it('2️⃣ Usage‑Based Billing – aggregates usage events', async () => {
    const custRes = await request(app.getHttpServer())
      .post(`/${apiPrefix}/customers`)
      .set('Authorization', authHeader())
      .send({ name: 'Usage Corp', email: 'usage@test.com' })
      .expect(201);
    const customerId = custRes.body.data.id;
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/customers/${customerId}/subscribe`)
      .set('Authorization', authHeader())
      .send({ planId: 2 }) // assume plan 2 is metered
      .expect(201);

    // Simulate usage events (test‑only endpoint)
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/usage`)
      .set('Authorization', authHeader())
      .send({ customerId, amount: 0 })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/usage`)
      .set('Authorization', authHeader())
      .send({ customerId, amount: 1000 })
      .expect(201);

    // Trigger billing run (test‑only endpoint)
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/billing/run`)
      .set('Authorization', authHeader())
      .expect(200);

    const invRes = await request(app.getHttpServer())
      .get(`/${apiPrefix}/customers/${customerId}/invoices`)
      .set('Authorization', authHeader())
      .expect(200);
    const invoice = invRes.body.data.find((i) => i.status === 'UNPAID');
    expect(invoice.amount).toBeGreaterThan(0);
    // Boundary checks
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/usage`)
      .set('Authorization', authHeader())
      .send({ customerId, amount: -5 })
      .expect(400);
  });

  it('3️⃣ M‑Pesa Payment Flow – valid webhook', async () => {
    // Setup unpaid invoice
    const custRes = await request(app.getHttpServer())
      .post(`/${apiPrefix}/customers`)
      .set('Authorization', authHeader())
      .send({ name: 'Pay Corp', email: 'pay@test.com' })
      .expect(201);
    const customerId = custRes.body.data.id;
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/customers/${customerId}/subscribe`)
      .set('Authorization', authHeader())
      .send({ planId: 1 })
      .expect(201);
    const invRes = await request(app.getHttpServer())
      .get(`/${apiPrefix}/customers/${customerId}/invoices`)
      .set('Authorization', authHeader())
      .expect(200);
    const invoiceId = invRes.body.data[0].id;
    const amount = invRes.body.data[0].amount;

    // Initiate payment (UI‑exposed endpoint)
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/payments/mpesa/request`)
      .set('Authorization', authHeader())
      .send({ invoiceId, amount })
      .expect(201);

    // Simulate valid webhook
    const token = config.get<string>('MPESA_WEBHOOK_SECRET');
    const webhookPayload = {
      TransactionID: 'TX123456789',
      InvoiceID: invoiceId,
      Amount: amount,
      PhoneNumber: '+254712345678',
    };
    await request(app.getHttpServer())
      .post(`/${apiPrefix}/payments/mpesa/callback?token=${token}`)
      .set('X-Forwarded-For', '196.201.0.10') // allowed Safaricom subnet
      .send(webhookPayload)
      .expect(200);

    // Verify payment recorded and invoice marked paid
    const payRes = await request(app.getHttpServer())
      .get(`/${apiPrefix}/payments/${invoiceId}`)
      .set('Authorization', authHeader())
      .expect(200);
    expect(payRes.body.data.status).toBe('PAID');
  });

  // Additional scenarios (invalid token, disallowed IP, duplicate webhook, timeout) would follow the same pattern.
});
