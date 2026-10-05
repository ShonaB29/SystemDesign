import { OrderRepository } from './OrderRepository';

export class OrderService {
  constructor(private orderRepo = new OrderRepository()) {}

  async createOrder(data: { reservationId: string; paymentId: string; customerId: string; amount: number }) {
    // 1. Idempotency Check (Duplicate order for same payment)
    const existing = await this.orderRepo.findByPaymentId(data.paymentId);
    if (existing) {
      return existing; // idempotent response
    }

    // 2. Create Order
    return this.orderRepo.createOrder({
      customerId: data.customerId,
      reservationId: data.reservationId,
      paymentId: data.paymentId,
      status: 'CONFIRMED',
      totalAmount: data.amount
    });
  }

  async getOrder(id: string) {
    return this.orderRepo.findById(id);
  }

  async getOrderByPaymentId(paymentId: string) {
    return this.orderRepo.findByPaymentId(paymentId);
  }
}
