import { Request, Response } from 'express';
import { PaymentService } from './PaymentService';

export class PaymentController {
  private service = new PaymentService();

  processCharge = async (req: Request, res: Response) => {
    try {
      const { reservationId, customerId, amount, idempotencyKey } = req.body;
      
      if (!reservationId || !customerId || !amount || !idempotencyKey) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
      }

      const payment = await this.service.processCharge({
        reservationId,
        customerId,
        amount,
        idempotencyKey
      });

      res.status(200).json({ success: true, data: payment });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };
}
