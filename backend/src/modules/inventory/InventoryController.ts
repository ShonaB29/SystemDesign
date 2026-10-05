import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma';

export class InventoryController {
  // GET /api/inventory — returns the first product's inventory (prototype: 1 flash product)
  getAll = async (req: Request, res: Response) => {
    try {
      const inventory = await prisma.inventory.findFirst({
        include: { product: true }
      });
      if (!inventory) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No inventory found' } });
      }
      res.json({ success: true, data: {
        productId: inventory.productId,
        productName: inventory.product.name,
        total: inventory.availableQuantity + inventory.reservedQuantity + inventory.soldQuantity,
        available: inventory.availableQuantity,
        reserved: inventory.reservedQuantity,
        sold: inventory.soldQuantity,
        isConsistent: true
      }});
    } catch (e: any) {
      res.status(500).json({ success: false, error: { message: e.message } });
    }
  };

  // GET /api/inventory/:productId
  getByProduct = async (req: Request, res: Response) => {
    try {
      const inventory = await prisma.inventory.findUnique({
        where: { productId: req.params.productId },
        include: { product: true }
      });
      if (!inventory) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Inventory not found' } });
      }
      res.json({ success: true, data: {
        productId: inventory.productId,
        productName: inventory.product.name,
        total: inventory.availableQuantity + inventory.reservedQuantity + inventory.soldQuantity,
        available: inventory.availableQuantity,
        reserved: inventory.reservedQuantity,
        sold: inventory.soldQuantity,
        isConsistent: true
      }});
    } catch (e: any) {
      res.status(500).json({ success: false, error: { message: e.message } });
    }
  };
}
