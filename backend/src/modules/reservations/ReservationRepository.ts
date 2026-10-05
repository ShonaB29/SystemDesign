import { prisma } from '../../infrastructure/database/prisma';

export class ReservationRepository {
  async createReservation(data: {
    customerId: string;
    productId: string;
    quantity: number;
    status: string;
    idempotencyKey: string;
    expiresAt: Date;
  }) {
    return prisma.reservation.create({ data });
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    return prisma.reservation.findUnique({
      where: { idempotencyKey },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.reservation.update({
      where: { id },
      data: { status },
    });
  }
}
