import { prisma } from '../../infrastructure/database/prisma';

export class InventoryRepository {
  /**
   * CRITICAL: Atomic inventory reservation logic.
   * This guarantees 0 overselling under extreme concurrency.
   */
  async reserveAtomically(productId: string, quantity: number): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE "Inventory"
      SET 
        "availableQuantity" = "availableQuantity" - ${quantity},
        "reservedQuantity" = "reservedQuantity" + ${quantity},
        "version" = "version" + 1,
        "updatedAt" = NOW()
      WHERE "productId" = ${productId}
        AND "availableQuantity" >= ${quantity};
    `;
    return result === 1; // True if 1 row was updated
  }

  async releaseReservation(productId: string, quantity: number): Promise<void> {
    await prisma.$executeRaw`
      UPDATE "Inventory"
      SET 
        "availableQuantity" = "availableQuantity" + ${quantity},
        "reservedQuantity" = "reservedQuantity" - ${quantity},
        "version" = "version" + 1,
        "updatedAt" = NOW()
      WHERE "productId" = ${productId};
    `;
  }
}
