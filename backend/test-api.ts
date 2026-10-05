import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function testApi() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const product = await prisma.product.findFirst();
  const customer = await prisma.customer.findFirst();

  if (!product || !customer) {
    console.log("No product or customer found. Did you run the seed script?");
    return;
  }

  const API_URL = 'http://localhost:8080/api';
  console.log('--- STARTING SALESTORM API TESTS ---');

  // 1. Create a Reservation
  console.log('\n[1] Testing Reservation Creation...');
  const resReq = await fetch(`${API_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: customer.id,
      productId: product.id,
      quantity: 1,
      idempotencyKey: `rsv-${Date.now()}`
    })
  });
  const resData = await resReq.json();
  console.log(resData);

  if (!resData.success) {
    console.log('Reservation failed. Ensure you ran npx prisma db push && npx prisma db seed.');
    return;
  }
  const reservationId = resData.data.id;

  // 2. Test Idempotency (Duplicate Reservation)
  console.log('\n[2] Testing Reservation Idempotency (Duplicate)...');
  const resReq2 = await fetch(`${API_URL}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: customer.id,
      productId: product.id,
      quantity: 1,
      idempotencyKey: resData.data.idempotencyKey // SAME KEY
    })
  });
  const resData2 = await resReq2.json();
  console.log('Duplicate Reservation Response:', resData2);

  // 3. Process Payment
  console.log('\n[3] Testing Payment Processing...');
  const payReq = await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reservationId,
      customerId: customer.id,
      amount: 999.00,
      idempotencyKey: `pay-${Date.now()}`
    })
  });
  const payData = await payReq.json();
  console.log(payData);
  const paymentId = payData.data?.id;

  // 4. Create Order
  console.log('\n[4] Testing Order Creation...');
  if (paymentId) {
    const orderReq = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservationId,
        paymentId,
        customerId: customer.id,
        amount: 999.00
      })
    });
    const orderData = await orderReq.json();
    console.log(orderData);
  }

  console.log('\n--- TESTS FINISHED ---');
}

testApi();
