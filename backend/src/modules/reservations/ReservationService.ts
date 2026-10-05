import { InventoryRepository } from './InventoryRepository';
import { ReservationRepository } from './ReservationRepository';

export class ReservationService {
  constructor(
    private inventoryRepo = new InventoryRepository(),
    private reservationRepo = new ReservationRepository()
  ) {}

  async createReservation(data: { customerId: string; productId: string; quantity: number; idempotencyKey: string }) {
    // 1. Idempotency Check
    const existing = await this.reservationRepo.findByIdempotencyKey(data.idempotencyKey);
    if (existing) {
      return existing; // Idempotent response
    }

    // 2. Atomic Inventory Update
    const success = await this.inventoryRepo.reserveAtomically(data.productId, data.quantity);
    
    if (!success) {
      throw new Error('INSUFFICIENT_INVENTORY');
    }

    // 3. Create Reservation Record
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

    return this.reservationRepo.createReservation({
      customerId: data.customerId,
      productId: data.productId,
      quantity: data.quantity,
      status: 'RESERVED',
      idempotencyKey: data.idempotencyKey,
      expiresAt
    });
  }

  async handlePaymentFailure(reservationId: string, productId: string, quantity: number) {
    // 1. Release Inventory
    await this.inventoryRepo.releaseReservation(productId, quantity);
    // 2. Update Status
    await this.reservationRepo.updateStatus(reservationId, 'RELEASED');
  }
}
