import { prisma } from '../../infrastructure/database/prisma';

export class OrderRepository {
  async createOrder(data: {
    customerId: string;
    reservationId?: string;
    paymentId?: string;
    status: string;
    totalAmount: number;
  }) {
    return prisma.order.create({ data });
  }

  async findByPaymentId(paymentId: string) {
    return prisma.order.findUnique({
      where: { paymentId },
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, reservation: true }
    });
  }
}
