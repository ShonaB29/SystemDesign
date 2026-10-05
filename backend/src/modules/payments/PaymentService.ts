import { PaymentRepository } from './PaymentRepository';
import { PaymentGateway } from './PaymentGateway';
import { EventPublisher } from '../../common/events/EventPublisher';
import { ReservationRepository } from '../reservations/ReservationRepository';
import { InventoryRepository } from '../reservations/InventoryRepository';
import { prisma } from '../../infrastructure/database/prisma';

export class PaymentService {
  constructor(
    private paymentRepo = new PaymentRepository(),
    private gateway = new PaymentGateway(),
    private eventPublisher = new EventPublisher(),
    private reservationRepo = new ReservationRepository(),
    private inventoryRepo = new InventoryRepository()
  ) {}

  async processCharge(data: { reservationId: string; customerId: string; amount: number; idempotencyKey: string }) {
    // 1. Idempotency Check — never double-charge
    const existing = await this.paymentRepo.findByIdempotencyKey(data.idempotencyKey);
    if (existing) {
      return existing;
    }

    // 2. Validate reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId }
    });
    if (!reservation) {
      throw new Error('RESERVATION_NOT_FOUND');
    }

    // 3. Create PENDING payment record first (before charging)
    const payment = await this.paymentRepo.createPayment({
      customerId: data.customerId,
      amount: data.amount,
      status: 'PENDING',
      idempotencyKey: data.idempotencyKey
    });

    // 4. Process Charge via Gateway
    const gatewayResult = await this.gateway.charge(data.amount, data.idempotencyKey);

    if (gatewayResult.success) {
      // 5. Payment succeeded — update record
      const successfulPayment = await this.paymentRepo.updateStatus(payment.id, 'SUCCESS', gatewayResult.reference);

      // 6. Update reservation status to CONFIRMED
      await this.reservationRepo.updateStatus(data.reservationId, 'SOLD');

      // 7. Commit inventory: reservedQuantity → soldQuantity
      await prisma.$executeRaw`
        UPDATE "Inventory"
        SET 
          "reservedQuantity" = "reservedQuantity" - ${reservation.quantity},
          "soldQuantity" = "soldQuantity" + ${reservation.quantity},
          "version" = "version" + 1,
          "updatedAt" = NOW()
        WHERE "productId" = ${reservation.productId};
      `;

      // 8. Publish PaymentSucceeded event → OrderService
      await this.eventPublisher.publish('PaymentSucceeded', {
        paymentId: successfulPayment.id,
        reservationId: data.reservationId,
        customerId: data.customerId,
        amount: data.amount,
        occurredAt: new Date().toISOString()
      });

      return successfulPayment;
    } else {
      // Payment failed — release reservation and restore inventory
      const failedPayment = await this.paymentRepo.updateStatus(payment.id, 'FAILED', undefined, gatewayResult.reason);

      // Release reservation
      await this.reservationRepo.updateStatus(data.reservationId, 'RELEASED');

      // Restore inventory: reservedQuantity back to availableQuantity
      await this.inventoryRepo.releaseReservation(reservation.productId, reservation.quantity);

      return failedPayment;
    }
  }
}
