import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';
import { ReservationController } from './modules/reservations/ReservationController';
import { PaymentController } from './modules/payments/PaymentController';
import { OrderController } from './modules/orders/OrderController';
import { DashboardController } from './modules/dashboard/DashboardController';
import { InventoryController } from './modules/inventory/InventoryController';
import { prisma } from './infrastructure/database/prisma';

const app = express();
app.use(cors());
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redis.on('error', (err) => {
  // Silent fail if redis is down to allow prototype to run
});

// Controllers
const reservationController = new ReservationController();
const paymentController = new PaymentController();
const orderController = new OrderController();
const dashboardController = new DashboardController();
const inventoryController = new InventoryController();

// Flash Sale Admission Middleware
const admissionControl = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { productId } = req.body;
  if (!productId || redis.status !== 'ready') return next();

  try {
    const count = await redis.incr(`admission:${productId}:count`);
    if (count > 150) { 
       return res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Flash sale at capacity. Please try again.' } });
    }
    if (count === 1) {
      await redis.expire(`admission:${productId}:count`, 1);
    }
    next();
  } catch (error) {
    next(); // fail open if Redis is down
  }
};

// Routes — IMPORTANT: specific routes before parameterized ones
app.get('/api/inventory', inventoryController.getAll);
app.get('/api/inventory/:productId', inventoryController.getByProduct);
app.post('/api/reservations', admissionControl, reservationController.createReservation);
app.post('/api/payments', paymentController.processCharge);
app.post('/api/orders', orderController.createOrder);
app.get('/api/orders/by-payment/:paymentId', orderController.getOrderByPaymentId); // MUST be before /api/orders/:id
app.get('/api/orders/:id', orderController.getOrder);
app.get('/api/dashboard/metrics', dashboardController.getMetrics);
app.get('/api/health', (_req, res) => res.json({ success: true, data: { api: 'UP', database: 'UP', redis: redis.status } }));

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`[SALESTORM] Backend listening on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log(`[SALESTORM] Database connected`);
  } catch (err) {
    console.error(`[SALESTORM] Database connection failed`, err);
  }
});
