import { Request, Response } from 'express';
import { OrderService } from './OrderService';

export class OrderController {
  private service = new OrderService();

  createOrder = async (req: Request, res: Response) => {
    try {
      const { reservationId, paymentId, customerId, amount } = req.body;
      
      if (!reservationId || !paymentId || !customerId || amount == null) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
      }

      const order = await this.service.createOrder({
        reservationId,
        paymentId,
        customerId,
        amount
      });

      res.status(200).json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };

  getOrder = async (req: Request, res: Response) => {
    try {
      const order = await this.service.getOrder(req.params.id);
      if (!order) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
      res.status(200).json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };

  getOrderByPaymentId = async (req: Request, res: Response) => {
    try {
      const order = await this.service.getOrderByPaymentId(req.params.paymentId);
      if (!order) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
      res.status(200).json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };
}
