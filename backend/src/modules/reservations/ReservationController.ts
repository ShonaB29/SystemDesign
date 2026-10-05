import { Request, Response } from 'express';
import { ReservationService } from './ReservationService';

export class ReservationController {
  private service = new ReservationService();

  createReservation = async (req: Request, res: Response) => {
    try {
      const { customerId, productId, quantity, idempotencyKey } = req.body;
      
      if (!customerId || !productId || !quantity || !idempotencyKey) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
      }

      const reservation = await this.service.createReservation({
        customerId,
        productId,
        quantity,
        idempotencyKey
      });

      res.status(200).json({ success: true, data: reservation });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_INVENTORY') {
        return res.status(409).json({ success: false, error: { code: 'INSUFFICIENT_INVENTORY', message: 'No inventory available' } });
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };
}
