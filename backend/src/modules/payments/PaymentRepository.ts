import { prisma } from '../../infrastructure/database/prisma';

export class PaymentRepository {
  async createPayment(data: {
    customerId: string;
    amount: number;
    status: string;
    idempotencyKey: string;
    providerReference?: string;
    failureReason?: string;
  }) {
    return prisma.payment.create({ data });
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    return prisma.payment.findUnique({
      where: { idempotencyKey },
    });
  }

  async updateStatus(id: string, status: string, providerReference?: string, failureReason?: string) {
    return prisma.payment.update({
      where: { id },
      data: { status, providerReference, failureReason },
    });
  }
}
