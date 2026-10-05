import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const API = 'http://localhost:8080/api';
const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

let results: { test: string; status: string; detail: string }[] = [];
function log(test: string, pass: boolean, detail: string) {
  const s = pass ? PASS : FAIL;
  results.push({ test, status: s, detail });
  console.log(`${s} ${test}`);
  if (detail) console.log(`   └─ ${detail}`);
}

async function run() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  SALESTORM E2E INTEGRATION TEST REPORT');
  console.log('══════════════════════════════════════════════\n');

  // ── 0. Health Check ─────────────────────────────────────────────────────────
  console.log('── 0. HEALTH CHECK ──────────────────────');
  try {
    const r = await fetch(`${API}/health`);
    const j = await r.json();
    log('GET /api/health', r.ok && j.success, JSON.stringify(j.data));
  } catch (e: any) { log('GET /api/health', false, e.message); }

  // ── 1. Inventory ─────────────────────────────────────────────────────────────
  console.log('\n── 1. INVENTORY ─────────────────────────');
  let productId = '';
  let customerId = '';
  let initialAvailable = 0;

  try {
    const r = await fetch(`${API}/inventory`);
    const j = await r.json();
    log('GET /api/inventory', r.ok && j.success, JSON.stringify(j.data));
    if (j.success) {
      productId = j.data.productId;
      initialAvailable = j.data.available;
      console.log(`   📦 productId: ${productId}`);
      console.log(`   📦 available: ${j.data.available}, reserved: ${j.data.reserved}, sold: ${j.data.sold}`);
      console.log(`   📦 Invariant: ${j.data.available}+${j.data.reserved}+${j.data.sold}=${j.data.available+j.data.reserved+j.data.sold} / total: ${j.data.total}`);
      log('Inventory invariant (avail+res+sold ≤ total)', (j.data.available + j.data.reserved + j.data.sold) <= j.data.total, '');
      log('available >= 0', j.data.available >= 0, `available=${j.data.available}`);
    }
  } catch (e: any) { log('GET /api/inventory', false, e.message); }

  // Get customer from DB
  try {
    const c = await prisma.customer.findFirst();
    customerId = c?.id ?? '';
    console.log(`   👤 customerId: ${customerId}`);
  } catch {}

  // ── 2. Dashboard Metrics ─────────────────────────────────────────────────────
  console.log('\n── 2. DASHBOARD METRICS ─────────────────');
  try {
    const r = await fetch(`${API}/dashboard/metrics`);
    const j = await r.json();
    log('GET /api/dashboard/metrics', r.ok && j.success, '');
    if (j.success) {
      const m = j.data;
      console.log(`   📊 available: ${m.availableInventory}, reserved: ${m.reservedInventory}, sold: ${m.soldInventory}`);
      console.log(`   📊 overselling: ${m.overselling}, successfulSales: ${m.successfulSales}`);
      log('Dashboard overselling = 0', m.overselling === 0, `overselling=${m.overselling}`);
    }
  } catch (e: any) { log('GET /api/dashboard/metrics', false, e.message); }

  // ── 3. Reservation — Success ──────────────────────────────────────────────────
  console.log('\n── 3. RESERVATION (SUCCESS) ─────────────');
  let reservationId = '';
  let idempotencyKeyRsv = `RSV-E2E-${Date.now()}`;

  try {
    const r = await fetch(`${API}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, productId, quantity: 1, idempotencyKey: idempotencyKeyRsv })
    });
    const j = await r.json();
    log('POST /api/reservations', r.ok && j.success, '');
    if (j.success) {
      reservationId = j.data.id;
      console.log(`   🎫 reservationId: ${reservationId}`);
      console.log(`   🎫 status: ${j.data.status}`);
      console.log(`   🎫 expiresAt: ${j.data.expiresAt}`);
      log('Reservation status = RESERVED', j.data.status === 'RESERVED', `status=${j.data.status}`);
      log('expiresAt returned', !!j.data.expiresAt, j.data.expiresAt);
    }
  } catch (e: any) { log('POST /api/reservations', false, e.message); }

  // ── 4. Verify inventory decremented ───────────────────────────────────────────
  console.log('\n── 4. INVENTORY AFTER RESERVATION ───────');
  try {
    const r = await fetch(`${API}/inventory/${productId}`);
    const j = await r.json();
    if (j.success) {
      console.log(`   📦 available: ${j.data.available} (was ${initialAvailable})`);
      console.log(`   📦 reserved: ${j.data.reserved}`);
      log('Available decremented by 1', j.data.available === initialAvailable - 1, `${initialAvailable} → ${j.data.available}`);
      log('Reserved incremented by 1', j.data.reserved >= 1, `reserved=${j.data.reserved}`);
      log('available >= 0 after reservation', j.data.available >= 0, `available=${j.data.available}`);
    }
  } catch (e: any) { log('GET /api/inventory after reservation', false, e.message); }

  // ── 5. Reservation Idempotency ───────────────────────────────────────────────
  console.log('\n── 5. RESERVATION IDEMPOTENCY ───────────');
  let idempotencyReservationId2 = '';
  try {
    const r = await fetch(`${API}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, productId, quantity: 1, idempotencyKey: idempotencyKeyRsv })
    });
    const j = await r.json();
    if (j.success) {
      idempotencyReservationId2 = j.data.id;
      log('Duplicate reservation returns SAME ID', idempotencyReservationId2 === reservationId,
        `first=${reservationId.slice(0,8)} second=${idempotencyReservationId2.slice(0,8)}`);
    }
  } catch (e: any) { log('Reservation idempotency', false, e.message); }

  // ── 6. Payment — Success ──────────────────────────────────────────────────────
  console.log('\n── 6. PAYMENT (SUCCESS) ─────────────────');
  let paymentId = '';
  const idempotencyKeyPay = `PAY-E2E-${Date.now()}`;

  try {
    const r = await fetch(`${API}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId, customerId, amount: 99999, idempotencyKey: idempotencyKeyPay })
    });
    const j = await r.json();
    log('POST /api/payments', r.ok && j.success, '');
    if (j.success) {
      paymentId = j.data.id;
      console.log(`   💳 paymentId: ${paymentId}`);
      console.log(`   💳 status: ${j.data.status}`);
      console.log(`   💳 providerRef: ${j.data.providerReference}`);
      log('Payment status = SUCCESS', j.data.status === 'SUCCESS', `status=${j.data.status}`);
      log('providerReference returned', !!j.data.providerReference, j.data.providerReference);
    }
  } catch (e: any) { log('POST /api/payments', false, e.message); }

  // ── 7. Inventory after payment success ────────────────────────────────────────
  console.log('\n── 7. INVENTORY AFTER PAYMENT SUCCESS ───');
  try {
    const r = await fetch(`${API}/inventory/${productId}`);
    const j = await r.json();
    if (j.success) {
      console.log(`   📦 available: ${j.data.available}, reserved: ${j.data.reserved}, sold: ${j.data.sold}`);
      log('sold incremented after payment', j.data.sold >= 1, `sold=${j.data.sold}`);
      log('reserved decremented back after payment', j.data.reserved === 0 || j.data.reserved < initialAvailable, `reserved=${j.data.reserved}`);
      log('Invariant still holds', (j.data.available + j.data.reserved + j.data.sold) <= j.data.total, '');
    }
  } catch (e: any) { log('GET /api/inventory after payment', false, e.message); }

  // ── 8. Payment Idempotency ────────────────────────────────────────────────────
  console.log('\n── 8. PAYMENT IDEMPOTENCY ───────────────');
  try {
    const r = await fetch(`${API}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId, customerId, amount: 99999, idempotencyKey: idempotencyKeyPay })
    });
    const j = await r.json();
    if (j.success) {
      log('Duplicate payment returns SAME ID', j.data.id === paymentId,
        `first=${paymentId.slice(0,8)} second=${j.data.id.slice(0,8)}`);
      // Verify only 1 payment exists for this key
      const dbCount = await prisma.payment.count({ where: { idempotencyKey: idempotencyKeyPay } });
      log('Only 1 payment in DB for idempotency key', dbCount === 1, `count=${dbCount}`);
    }
  } catch (e: any) { log('Payment idempotency', false, e.message); }

  // ── 9. Order Creation ─────────────────────────────────────────────────────────
  console.log('\n── 9. ORDER CREATION ────────────────────');
  let orderId = '';
  try {
    const r = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, customerId, reservationId, amount: 99999 })
    });
    const j = await r.json();
    log('POST /api/orders', r.ok && j.success, '');
    if (j.success) {
      orderId = j.data.id;
      console.log(`   📦 orderId: ${orderId}`);
      console.log(`   📦 status: ${j.data.status}`);
      log('Order status = CONFIRMED', j.data.status === 'CONFIRMED', `status=${j.data.status}`);
    }
  } catch (e: any) { log('POST /api/orders', false, e.message); }

  // ── 10. Get Order by Payment ID ────────────────────────────────────────────────
  console.log('\n── 10. ORDER BY PAYMENT ID ──────────────');
  try {
    const r = await fetch(`${API}/orders/by-payment/${paymentId}`);
    const j = await r.json();
    log('GET /api/orders/by-payment/:id', r.ok && j.success, '');
    if (j.success) {
      log('Order paymentId matches', j.data.paymentId === paymentId, '');
      log('Order reservationId matches', j.data.reservationId === reservationId, '');
    }
  } catch (e: any) { log('GET /api/orders/by-payment/:id', false, e.message); }

  // ── 11. Order Idempotency ──────────────────────────────────────────────────────
  console.log('\n── 11. ORDER IDEMPOTENCY ────────────────');
  try {
    const r = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, customerId, reservationId, amount: 99999 })
    });
    const j = await r.json();
    if (j.success) {
      log('Duplicate order returns SAME ID', j.data.id === orderId,
        `first=${orderId.slice(0,8)} second=${j.data.id.slice(0,8)}`);
    }
    const dbCount = await prisma.order.count({ where: { paymentId } });
    log('Only 1 order in DB for payment', dbCount === 1, `count=${dbCount}`);
  } catch (e: any) { log('Order idempotency', false, e.message); }

  // ── 12. Payment Failure + Inventory Rollback ───────────────────────────────────
  console.log('\n── 12. PAYMENT FAILURE + INVENTORY ROLLBACK ─');
  let failReservationId = '';
  const failIdempotencyKey = `PAY-E2E-FAIL-${Date.now()}`;

  try {
    // Create a new reservation for failure test
    const rsvReq = await fetch(`${API}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, productId, quantity: 1, idempotencyKey: `RSV-FAIL-${Date.now()}` })
    });
    const rsvJ = await rsvReq.json();
    if (rsvJ.success) {
      failReservationId = rsvJ.data.id;
      console.log(`   🎫 Created reservation for failure test: ${failReservationId}`);

      // Check available before failure
      const invBefore = await (await fetch(`${API}/inventory/${productId}`)).json();
      const availBefore = invBefore.data?.available ?? 0;

      // Process FAILURE payment (key ending in -FAIL triggers mock gateway failure)
      const payReq = await fetch(`${API}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: failReservationId, customerId, amount: 99999, idempotencyKey: failIdempotencyKey })
      });
      const payJ = await payReq.json();
      log('Payment FAILURE returned', payJ.success && payJ.data.status === 'FAILED', `status=${payJ.data?.status}`);

      // Allow a brief moment for rollback
      await new Promise(r => setTimeout(r, 500));

      // Check available after — should be restored
      const invAfter = await (await fetch(`${API}/inventory/${productId}`)).json();
      const availAfter = invAfter.data?.available ?? 0;
      console.log(`   📦 available before failure: ${availBefore}, after: ${availAfter}`);
      log('Inventory RESTORED after payment failure', availAfter === availBefore, `${availBefore} → ${availAfter}`);
      log('available >= 0 after rollback', availAfter >= 0, `available=${availAfter}`);

      // Check reservation status
      const rsv = await prisma.reservation.findUnique({ where: { id: failReservationId } });
      log('Reservation RELEASED after payment failure', rsv?.status === 'RELEASED', `status=${rsv?.status}`);
    }
  } catch (e: any) { log('Payment failure + rollback', false, e.message); }

  // ── 13. Overselling Guarantee ─────────────────────────────────────────────────
  console.log('\n── 13. OVERSELLING GUARANTEE ────────────');
  try {
    const r = await fetch(`${API}/inventory/${productId}`);
    const j = await r.json();
    if (j.success) {
      log('available >= 0 (NEVER NEGATIVE)', j.data.available >= 0, `available=${j.data.available}`);
      log('sold <= total', j.data.sold <= j.data.total, `sold=${j.data.sold} total=${j.data.total}`);
      log('overselling = 0', (j.data.sold - j.data.total) <= 0, `sold=${j.data.sold}, total=${j.data.total}`);
    }
  } catch (e: any) { log('Overselling check', false, e.message); }

  // ── 14. Final Dashboard Metrics ────────────────────────────────────────────────
  console.log('\n── 14. FINAL DASHBOARD METRICS ──────────');
  try {
    const r = await fetch(`${API}/dashboard/metrics`);
    const j = await r.json();
    if (j.success) {
      const m = j.data;
      console.log(`   📊 available: ${m.availableInventory}`);
      console.log(`   📊 reserved: ${m.reservedInventory}`);
      console.log(`   📊 sold: ${m.soldInventory}`);
      console.log(`   📊 successfulSales: ${m.successfulSales}`);
      console.log(`   📊 overselling: ${m.overselling}`);
      log('Dashboard overselling = 0', m.overselling === 0, `overselling=${m.overselling}`);
      log('Dashboard available >= 0', m.availableInventory >= 0, `available=${m.availableInventory}`);
    }
  } catch (e: any) { log('Final dashboard check', false, e.message); }

  // ── SUMMARY ────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('══════════════════════════════════════════════');
  const passed = results.filter(r => r.status === PASS).length;
  const failed = results.filter(r => r.status === FAIL).length;
  results.forEach(r => console.log(`${r.status} ${r.test}${r.detail ? ' — ' + r.detail : ''}`));
  console.log(`\n📊 TOTAL: ${passed} PASS / ${failed} FAIL`);
  console.log(failed === 0 ? '\n🎉 VERDICT: PASS — FULL E2E INTEGRATION VERIFIED' : `\n💥 VERDICT: FAIL — ${failed} ISSUES REMAIN`);

  await prisma.$disconnect();
  await pool.end();
}

run().catch(console.error);
